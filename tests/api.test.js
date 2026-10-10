import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
const dir = mkdtempSync(path.join(tmpdir(), "pixel-test-")),
  database = path.join(dir, "test.db"),
  port = 3217,
  base = `http://127.0.0.1:${port}`;
let processHandle, regular, owner, other;
async function req(endpoint, method = "GET", body, cookie) {
  const res = await fetch(base + "/api" + endpoint, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  return {
    status: res.status,
    data: res.status === 302 ? null : await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
  };
}
before(async () => {
  processHandle = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: database,
      NODE_ENV: "production",
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      REQUIRE_REMOTE_DATABASE: "false",
      BREVO_API_KEY: "",
      RESEND_API_KEY: "",
      SMTP_HOST: "",
      APP_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("Server startup timeout")),
      10000,
    );
    processHandle.stdout.on("data", (data) => {
      if (data.toString().includes("running on port")) {
        clearTimeout(t);
        resolve();
      }
    });
    processHandle.on("exit", (code) => {
      clearTimeout(t);
      reject(new Error("Server exited " + code));
    });
  });
});
after(async () => {
  processHandle?.kill("SIGTERM");
  await new Promise((resolve) => processHandle?.once("exit", resolve));
  rmSync(dir, { recursive: true, force: true });
});
test("account, economy, moderation and ownership boundaries", async (t) => {
  await t.test("public bootstrap includes shared rooms and shop", async () => {
    const res = await req("/bootstrap");
    assert.equal(res.status, 200);
    assert.equal(res.data.rooms.length, 3);
    assert.equal(res.data.items.length, 10);
    assert.equal(res.data.user, null);
  });
  await t.test(
    "register hashes passwords and creates an HttpOnly session",
    async () => {
      const res = await req("/register", "POST", {
        email: "player@example.com",
        username: "Player",
        password: "correct horse battery",
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.user.coins, 500);
      assert.equal(res.data.user.admin, false);
      assert.equal(res.data.user.password, undefined);
      regular = res.cookie;
      const db = new DatabaseSync(database);
      assert.notEqual(
        db.prepare("SELECT password FROM users WHERE id=1").get().password,
        "correct horse battery",
      );
      db.close();
    },
  );
  await t.test(
    "case-insensitive duplicate usernames are rejected",
    async () => {
      const res = await req("/register", "POST", {
        email: "other@example.com",
        username: "player",
        password: "secure password here",
      });
      assert.equal(res.status, 409);
    },
  );
  await t.test("explicit ukn exception gains admin without marking its email verified", async () => {
    const registered = await req('/register','POST',{email:'somkene.ebukambonu@millburnacademy.org.ukn',username:'ExceptionOwner',password:'exception owner test password'});
    assert.equal(registered.status,200);
    assert.equal(registered.data.user.admin,true);
    assert.equal(registered.data.user.verified,false);
    assert.equal((await req('/admin','GET',undefined,registered.cookie)).status,200);
    assert.equal((await req('/admin/users','PATCH',{id:registered.data.user.id,banned:true},registered.cookie)).status,400);
    const sent=await req('/messages','POST',{room:1,content:'Exception admin badge'},registered.cookie);
    assert.equal(sent.status,200);
    const message=(await req('/messages?room=1')).data.messages.find(m=>m.id===sent.data.id);
    assert.equal(message.admin,true);
    assert.equal(message.verified,0);
    await req('/admin/messages','DELETE',{id:sent.data.id},registered.cookie);
  });
  await t.test(
    "unverified owner email cannot acquire admin powers",
    async () => {
      const res = await req("/register", "POST", {
        email: "somkene.ebukambonu@millburnacademy.org.uk",
        username: "Somkene",
        password: "owner secure password",
      });
      owner = res.cookie;
      assert.equal(res.data.user.admin, false);
      assert.equal((await req("/admin", "GET", undefined, owner)).status, 403);
      assert.equal(
        (await req("/admin/settings", "PATCH", { maintenance: true }, regular))
          .status,
        403,
      );
    },
  );
  await t.test("old mistaken admin email stays a regular account", async () => {
    const res = await req("/register", "POST", {
      email: "kamneto.ebukambonu@gmail.com",
      username: "OldEmail",
      password: "safe long password",
    });
    other = res.cookie;
    const db = new DatabaseSync(database);
    db.prepare("UPDATE users SET verified=1 WHERE email=?").run(
      "kamneto.ebukambonu@gmail.com",
    );
    db.close();
    assert.equal(
      (await req("/bootstrap", "GET", undefined, other)).data.user.admin,
      false,
    );
  });
  await t.test(
    "verification token enables owner access once and expires",
    async () => {
      const db = new DatabaseSync(database),
        token = randomBytes(32).toString("hex"),
        ownerId = db
          .prepare("SELECT id FROM users WHERE email=?")
          .get("somkene.ebukambonu@millburnacademy.org.uk").id;
      db.prepare("INSERT INTO verifications VALUES (?,?,?)").run(
        createHash("sha256").update(token).digest("hex"),
        ownerId,
        Date.now() + 60000,
      );
      db.close();
      assert.equal((await req("/verify?token=" + token)).status, 403);
      assert.equal(
        (await req("/verify?token=" + token, "GET", undefined, owner)).status,
        302,
      );
      assert.equal(
        (await req("/bootstrap", "GET", undefined, owner)).data.user.admin,
        true,
      );
      assert.equal((await req("/verify?token=" + token)).status, 400);
      assert.equal((await req("/admin", "GET", undefined, owner)).status, 200);
    },
  );
  await t.test(
    "second corrected owner address is recognized only after verification",
    async () => {
      const res = await req("/register", "POST", {
        email: "kamneto.ebukambonu@millburnacademy.org.uk",
        username: "Kamneto",
        password: "correct owner password",
      });
      assert.equal(res.data.user.admin, false);
      const db = new DatabaseSync(database);
      db.prepare("UPDATE users SET verified=1 WHERE email=?").run(
        "kamneto.ebukambonu@millburnacademy.org.uk",
      );
      db.close();
      assert.equal(
        (await req("/bootstrap", "GET", undefined, res.cookie)).data.user.admin,
        true,
      );
    },
  );
  await t.test("daily coins can only be claimed once per UTC day", async () => {
    const a = await req("/daily-reward", "POST", {}, regular);
    assert.equal(a.data.user.coins, 600);
    assert.equal((await req("/daily-reward", "POST", {}, regular)).status, 400);
  });
  await t.test(
    "shop ignores submitted price and prevents double purchase",
    async () => {
      const a = await req(
        "/purchase",
        "POST",
        { item: "theme-lavender", price: 0 },
        regular,
      );
      assert.equal(a.data.user.coins, 350);
      assert.ok(a.data.user.inventory.includes("theme-lavender"));
      assert.equal(
        (await req("/purchase", "POST", { item: "theme-lavender" }, regular))
          .status,
        400,
      );
      assert.equal(
        (await req("/profile", "PATCH", { item: "avatar-dragon" }, regular))
          .status,
        400,
      );
      assert.equal(
        (await req("/profile", "PATCH", { item: "theme-lavender" }, regular))
          .data.user.theme,
        "lavender",
      );
    },
  );
  await t.test(
    "owner catalog edits affect actual purchase pricing",
    async () => {
      assert.equal(
        (
          await req(
            "/admin/settings",
            "PATCH",
            {
              itemOverrides: {
                "avatar-fox": { price: 50, name: "Friend fox" },
              },
            },
            owner,
          )
        ).status,
        200,
      );
      const purchase = await req(
        "/purchase",
        "POST",
        { item: "avatar-fox" },
        regular,
      );
      assert.equal(purchase.data.user.coins, 300);
      assert.equal(
        (await req("/bootstrap")).data.items.find((i) => i.id === "avatar-fox")
          .name,
        "Friend fox",
      );
    },
  );
  await t.test(
    "shared chat delivers messages and limits privileged room operations",
    async () => {
      const sent = await req(
        "/messages",
        "POST",
        { room: 1, content: "Hello shared playground!" },
        regular,
      );
      assert.equal(sent.status, 200);
      assert.ok(
        (await req("/messages?room=1")).data.messages.some(
          (m) => m.content === "Hello shared playground!",
        ),
      );
      assert.equal(
        (await req("/admin/rooms", "POST", { name: "new-room" }, regular))
          .status,
        403,
      );
      const room = await req(
        "/admin/rooms",
        "POST",
        { name: "new-room", description: "New space" },
        owner,
      );
      assert.equal(room.data.rooms.length, 4);
      assert.equal(
        (await req("/admin/messages", "DELETE", { id: sent.data.id }, owner))
          .status,
        200,
      );
      assert.equal((await req("/messages?room=1")).data.messages.length, 0);
    },
  );
  await t.test(
    "maintenance blocks regular writes but leaves owner controls usable",
    async () => {
      await req("/admin/settings", "PATCH", { maintenance: true }, owner);
      assert.equal(
        (
          await req(
            "/messages",
            "POST",
            { room: 1, content: "blocked" },
            regular,
          )
        ).status,
        503,
      );
      assert.equal((await req("/admin", "GET", undefined, owner)).status, 200);
      await req("/admin/settings", "PATCH", { maintenance: false }, owner);
    },
  );
  await t.test(
    "concurrent claims and purchases cannot duplicate coins or overspend",
    async () => {
      const registered = await req("/register", "POST", {
        email: "race@example.com",
        username: "RacePlayer",
        password: "a concurrent test password",
      });
      const claims = await Promise.all([
        req("/daily-reward", "POST", {}, registered.cookie),
        req("/daily-reward", "POST", {}, registered.cookie),
      ]);
      assert.deepEqual(claims.map((x) => x.status).sort(), [200, 400]);
      assert.equal(
        (await req("/bootstrap", "GET", undefined, registered.cookie)).data.user
          .coins,
        600,
      );
      const purchases = await Promise.all([
        req("/purchase", "POST", { item: "theme-sunset" }, registered.cookie),
        req("/purchase", "POST", { item: "theme-rose" }, registered.cookie),
      ]);
      assert.deepEqual(purchases.map((x) => x.status).sort(), [200, 400]);
      const profile = (
        await req("/bootstrap", "GET", undefined, registered.cookie)
      ).data.user;
      assert.ok([200, 250].includes(profile.coins));
      assert.equal(profile.inventory.length, 1);
    },
  );
  await t.test(
    "ban revokes sessions and owner accounts cannot be banned",
    async () => {
      const id = (await req("/bootstrap", "GET", undefined, regular)).data.user
        .id;
      assert.equal(
        (await req("/admin/users", "PATCH", { id, banned: true }, owner))
          .status,
        200,
      );
      assert.equal(
        (await req("/bootstrap", "GET", undefined, regular)).data.user,
        null,
      );
      assert.equal(
        (
          await req("/login", "POST", {
            email: "player@example.com",
            password: "correct horse battery",
          })
        ).status,
        403,
      );
      const ownerId = (await req("/bootstrap", "GET", undefined, owner)).data
        .user.id;
      assert.equal(
        (
          await req(
            "/admin/users",
            "PATCH",
            { id: ownerId, banned: true },
            owner,
          )
        ).status,
        400,
      );
    },
  );
  await t.test(
    "cross-origin mutations and non-JSON requests are rejected",
    async () => {
      const res = await fetch(base + "/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
        },
        body: "{}",
      });
      assert.equal(res.status, 403);
      const plain = await fetch(base + "/api/register", {
        method: "POST",
        body: "{}",
      });
      assert.equal(plain.status, 415);
    },
  );
  await t.test(
    "admin audit log records moderation and content edits",
    async () => {
      const res = await req("/admin", "GET", undefined, owner);
      assert.ok(res.data.audit.some((x) => x.action === "settings"));
      assert.ok(res.data.audit.some((x) => x.action === "user update"));
    },
  );
});
