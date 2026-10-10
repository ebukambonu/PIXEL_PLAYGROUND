import http from "node:http";
import { openDatabase } from "./src/database.js";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
// Use the cloud proxy for HTTPS email delivery, including injected authentication.
http.setGlobalProxyFromEnv();
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DATABASE_PATH || path.join(root, "data/pixel.db");
if (
  process.env.REQUIRE_REMOTE_DATABASE === "true" &&
  !process.env.TURSO_DATABASE_URL
)
  throw new Error(
    "This deployment requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN; local storage is temporary.",
  );
process.env.APP_URL ||= process.env.RENDER_EXTERNAL_URL;
const db = openDatabase({
  file: dbPath,
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
if (!db.remote)
  await db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
await db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, verified INTEGER DEFAULT 0, banned INTEGER DEFAULT 0, coins INTEGER DEFAULT 500, avatar TEXT DEFAULT '👾', theme TEXT DEFAULT 'midnight', created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER);
CREATE TABLE IF NOT EXISTS verifications(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY, name TEXT UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, room_id INTEGER REFERENCES rooms(id), user_id INTEGER REFERENCES users(id), content TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS inventory(user_id INTEGER REFERENCES users(id), item_id TEXT, PRIMARY KEY(user_id,item_id));
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), item_id TEXT, cost INTEGER, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rewards(user_id INTEGER REFERENCES users(id), day TEXT, PRIMARY KEY(user_id,day));
CREATE TABLE IF NOT EXISTS scores(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), game TEXT, score INTEGER, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, actor INTEGER REFERENCES users(id), action TEXT, details TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);`);
for (const [name, description] of [
  ["general", "The place to hang out."],
  ["game-talk", "Strategies, scores & a little friendly competition."],
  ["off-topic", "Everything else in your universe."],
])
  await db
    .prepare("INSERT OR IGNORE INTO rooms(name,description) VALUES (?,?)")
    .run(name, description);
for (const [key, value] of Object.entries({
  siteName: "Pixel Playground",
  tagline: "A little play. A lot of possibilities.",
  announcement:
    "Welcome to your new favorite corner of the internet. Make yourself at home ✨",
  announcementEnabled: true,
  maintenance: false,
  disabledGames: [],
  heroTitle: "Your daily escape.",
  heroSubtitle: "Big adventures. Little breaks. A whole world of play.",
  chatEnabled: true,
  shopEnabled: true,
  itemOverrides: {},
  gameOverrides: {},
}))
  await db
    .prepare("INSERT OR IGNORE INTO settings VALUES (?,?)")
    .run(key, JSON.stringify(value));
export const UNVERIFIED_ADMIN_EMAIL = "somkene.ebukambonu@millburn.org.uk";
export const ADMINS = new Set([
  UNVERIFIED_ADMIN_EMAIL,
  "somkene.ebukambonu@millburnacademy.org.uk",
  "kamneto.ebukambonu@millburnacademy.org.uk",
]);
export const ITEMS = [
  {
    id: "theme-lavender",
    type: "theme",
    name: "Lavender haze",
    value: "lavender",
    price: 250,
    description: "A softer side of the arcade",
    color: "#c4a5fc",
  },
  {
    id: "theme-ocean",
    type: "theme",
    name: "Ocean drive",
    value: "ocean",
    price: 300,
    description: "Cool blue. Endless possibilities.",
    color: "#73d9ff",
  },
  {
    id: "theme-sunset",
    type: "theme",
    name: "Sunset club",
    value: "sunset",
    price: 350,
    description: "Golden hour, all day long",
    color: "#ffab73",
  },
  {
    id: "theme-rose",
    type: "theme",
    name: "Pink pixels",
    value: "rose",
    price: 400,
    description: "A little pink goes a long way",
    color: "#ff94be",
  },
  {
    id: "avatar-fox",
    type: "avatar",
    name: "Night fox",
    value: "🦊",
    price: 150,
    description: "Small fox. Big energy.",
  },
  {
    id: "avatar-robot",
    type: "avatar",
    name: "Player bot",
    value: "🤖",
    price: 200,
    description: "Built different.",
  },
  {
    id: "avatar-cat",
    type: "avatar",
    name: "Cosmic cat",
    value: "🐱",
    price: 200,
    description: "Nine lives. Infinite games.",
  },
  {
    id: "avatar-dragon",
    type: "avatar",
    name: "Pixel dragon",
    value: "🐲",
    price: 300,
    description: "A legendary little companion.",
  },
  {
    id: "avatar-astronaut",
    type: "avatar",
    name: "Space cadet",
    value: "👨‍🚀",
    price: 250,
    description: "Out of this world.",
  },
  {
    id: "avatar-unicorn",
    type: "avatar",
    name: "Dream rider",
    value: "🦄",
    price: 350,
    description: "Keep it magical.",
  },
];
const sha = (value) => createHash("sha256").update(value).digest("hex");
const isAdmin = (user) => Boolean(user && ADMINS.has(user.email) && (user.verified || user.email === UNVERIFIED_ADMIN_EMAIL));
const safeUser = async (user) =>
  user
    ? {
        id: user.id,
        email: user.email,
        username: user.username,
        verified: Boolean(user.verified),
        banned: Boolean(user.banned),
        coins: user.coins,
        avatar: user.avatar,
        theme: user.theme,
        admin: isAdmin(user),
        inventory: (
          await db
            .prepare("SELECT item_id FROM inventory WHERE user_id=?")
            .all(user.id)
        ).map((x) => x.item_id),
      }
    : null;
async function getItems() {
  const overrides = (await getSettings()).itemOverrides || {};
  return ITEMS.map((item) => ({
    ...item,
    ...overrides[item.id],
  }));
}
function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
function passwordMatches(password, hash) {
  const [salt, digest] = hash.split(":");
  return timingSafeEqual(
    Buffer.from(digest, "hex"),
    scryptSync(password, salt, 64),
  );
}
const limits = new Map();
function rate(key, max, windowMs) {
  const now = Date.now();
  const values = (limits.get(key) || []).filter((t) => now - t < windowMs);
  if (values.length >= max)
    throw Object.assign(new Error("Please slow down and try again shortly."), {
      status: 429,
    });
  values.push(now);
  limits.set(key, values);
}
async function cleanupExpired() {
  const now = Date.now();
  for (const [key, values] of limits) {
    const recent = values.filter((t) => now - t < 3600000);
    if (recent.length) limits.set(key, recent);
    else limits.delete(key);
  }
  await db.prepare("DELETE FROM sessions WHERE expires<?").run(now);
  await db.prepare("DELETE FROM verifications WHERE expires<?").run(now);
}
setInterval(() => {
  cleanupExpired().catch(() =>
    console.error("Database cleanup failed; will retry later."),
  );
}, 300000).unref();
function fail(message, status = 400) {
  throw Object.assign(new Error(message), {
    status,
  });
}
async function getSettings() {
  return Object.fromEntries(
    (await db.prepare("SELECT * FROM settings").all()).map((x) => [
      x.key,
      JSON.parse(x.value),
    ]),
  );
}
async function sessionUser(req) {
  const cookie = req.headers.cookie?.match(
    /(?:^|; )pixel_session=([a-f0-9]{64})(?:;|$)/,
  );
  if (!cookie) return null;
  return (
    (await db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON user_id=users.id WHERE token=? AND expires>?",
      )
      .get(sha(cookie[1]), Date.now())) || null
  );
}
function requireUser(user) {
  if (!user) fail("Please sign in first.", 401);
  if (user.banned) fail("This account has been banned.", 403);
}
function requireAdmin(user) {
  requireUser(user);
  if (!isAdmin(user)) fail("Administrator access required.", 403);
}
function cookie(token, age = 604800) {
  return `pixel_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.NODE_ENV === "production" && process.env.APP_URL?.startsWith("https:") ? "; Secure" : ""}`;
}
async function login(user, res) {
  const token = randomBytes(32).toString("hex");
  await db
    .prepare("INSERT INTO sessions VALUES (?,?,?)")
    .run(sha(token), user.id, Date.now() + 604800000);
  res.setHeader("Set-Cookie", cookie(token));
}
function mailConfigured() {
  return Boolean(
    process.env.APP_URL &&
    ((process.env.BREVO_API_KEY && process.env.EMAIL_FROM) ||
      (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) ||
      (process.env.SMTP_HOST && process.env.SMTP_FROM)),
  );
}
async function sendVerification(user) {
  if (!mailConfigured()) return false;
  const token = randomBytes(32).toString("hex");
  await db
    .prepare("INSERT INTO verifications VALUES (?,?,?)")
    .run(sha(token), user.id, Date.now() + 3600000);
  const message = {
    to: user.email,
    subject: "Verify your Pixel Playground account",
    text: `Welcome to Pixel Playground! While signed in to your account, verify your email using this one-hour link:\n${process.env.APP_URL.replace(/\/$/, "")}/api/verify?token=${token}\nIf you did not create this account, ignore this email.`,
  };
  try {
    if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "Pixel Playground", email: process.env.EMAIL_FROM },
          to: [{ email: user.email }],
          subject: message.subject,
          textContent: message.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Mail delivery failed");
    } else if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          ...message,
          to: [user.email],
          from: process.env.EMAIL_FROM,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Mail delivery failed");
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === "465",
        requireTLS: process.env.SMTP_PORT !== "465",
        connectionTimeout: 15000,
        socketTimeout: 15000,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
      await transporter.sendMail({
        ...message,
        from: process.env.SMTP_FROM,
      });
    }
    return true;
  } catch {
    await db.prepare("DELETE FROM verifications WHERE token=?").run(sha(token));
    return false;
  }
}
async function audit(actor, action, details) {
  await db
    .prepare("INSERT INTO audit(actor,action,details) VALUES (?,?,?)")
    .run(actor, action, JSON.stringify(details));
}
async function body(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) fail("Request too large.", 413);
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    fail("Invalid JSON.");
  }
}
function cleanText(value, min, max, label) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(`${label} must be ${min}–${max} characters.`);
  return value.trim();
}
async function api(req, res, url) {
  const user = await sessionUser(req),
    p = url.pathname,
    method = req.method;
  if (!["GET", "HEAD"].includes(method)) {
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== `http://${req.headers.host}` &&
      origin !== `https://${req.headers.host}` &&
      origin !== process.env.APP_URL
    )
      fail("Untrusted request origin.", 403);
    if (!(req.headers["content-type"] || "").startsWith("application/json"))
      fail("JSON content type required.", 415);
  }
  if (p === "/api/bootstrap" && method === "GET")
    return {
      user: user && !user.banned ? await safeUser(user) : null,
      settings: await getSettings(),
      rooms: await db.prepare("SELECT * FROM rooms ORDER BY id").all(),
      items: await getItems(),
      emailAvailable: mailConfigured(),
    };
  if (p === "/api/register" && method === "POST") {
    rate("auth:" + req.socket.remoteAddress, 20, 3600000);
    const b = await body(req);
    const email = cleanText(b.email, 5, 254, "Email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail("Enter a valid email address.");
    const username = cleanText(b.username, 3, 20, "Username");
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      fail("Use letters, numbers and underscores for your username.");
    if (
      typeof b.password !== "string" ||
      b.password.length < 10 ||
      b.password.length > 128
    )
      fail("Password must be 10–128 characters.");
    const password = b.password;
    if (
      await db
        .prepare(
          "SELECT id FROM users WHERE email=? OR username=? COLLATE NOCASE",
        )
        .get(email, username)
    )
      fail("That email or username is already registered.", 409);
    const result = await db
      .prepare("INSERT INTO users(email,username,password) VALUES (?,?,?)")
      .run(email, username, passwordHash(password));
    const created = await db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(result.lastInsertRowid);
    await login(created, res);
    const exempt = created.email === UNVERIFIED_ADMIN_EMAIL;
    const sent = exempt ? false : await sendVerification(created);
    return {
      user: await safeUser(created),
      message: exempt ? "Account created! Admin access is enabled. Email remains unverified." : sent
        ? "Account created! Check your email to verify."
        : "Account created! Email verification is awaiting server mail setup. Admin access stays locked until verification.",
    };
  }
  if (p === "/api/login" && method === "POST") {
    rate("auth:" + req.socket.remoteAddress, 20, 3600000);
    const b = await body(req);
    if (
      typeof b.email !== "string" ||
      typeof b.password !== "string" ||
      b.password.length > 128
    )
      fail("Enter your email and password.");
    const account = await db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(b.email.trim().toLowerCase());
    if (!account || !passwordMatches(b.password, account.password))
      fail("Email or password is incorrect.", 401);
    if (account.banned) fail("This account has been banned.", 403);
    await login(account, res);
    return {
      user: await safeUser(account),
    };
  }
  if (p === "/api/logout" && method === "POST") {
    const token = req.headers.cookie?.match(
      /pixel_session=([a-f0-9]{64})/,
    )?.[1];
    if (token)
      await db.prepare("DELETE FROM sessions WHERE token=?").run(sha(token));
    res.setHeader("Set-Cookie", cookie("", 0));
    return {
      ok: true,
    };
  }
  if (p === "/api/verify" && method === "GET") {
    const token = url.searchParams.get("token") || "";
    if (!/^[a-f0-9]{64}$/.test(token)) fail("Invalid verification link.");
    const v = await db
      .prepare("SELECT * FROM verifications WHERE token=? AND expires>?")
      .get(sha(token), Date.now());
    if (!v) fail("This link has expired or has already been used.");
    if (!user || user.id !== v.user_id)
      fail(
        "Sign in to the account that requested this verification, then reopen the link.",
        403,
      );
    await db.prepare("UPDATE users SET verified=1 WHERE id=?").run(v.user_id);
    await db
      .prepare("DELETE FROM verifications WHERE user_id=?")
      .run(v.user_id);
    res.writeHead(302, {
      Location: "/?verified=1",
    });
    res.end();
    return;
  }
  if (p === "/api/resend-verification" && method === "POST") {
    requireUser(user);
    rate("mail:" + user.id, 3, 3600000);
    if (user.verified)
      return {
        message: "Your email is already verified.",
      };
    const sent = await sendVerification(user);
    if (!sent)
      fail(
        "Email delivery is not configured or unavailable. Ask the site owner to configure email delivery.",
        503,
      );
    return {
      message: "Verification email sent.",
    };
  }
  const settings = await getSettings();
  if (
    settings.maintenance &&
    !isAdmin(user) &&
    !["/api/leaderboard"].includes(p)
  )
    fail("The playground is taking a short maintenance break.", 503);
  if (p === "/api/messages" && method === "GET") {
    if (!settings.chatEnabled && !isAdmin(user))
      fail("Chat is currently paused.", 403);
    const room = Number(url.searchParams.get("room") || 1);
    return {
      messages: (
        await db
          .prepare(
            `SELECT messages.id,content,messages.created,users.username,users.avatar,users.verified,users.email FROM messages JOIN users ON user_id=users.id WHERE room_id=? ORDER BY messages.id DESC LIMIT 80`,
          )
          .all(room)
      )
        .reverse()
        .map(({ email, ...m }) => ({
          ...m,
          admin: isAdmin({email, verified: m.verified}),
        })),
    };
  }
  if (p === "/api/messages" && method === "POST") {
    requireUser(user);
    if (!settings.chatEnabled && !isAdmin(user))
      fail("Chat is currently paused.", 403);
    rate("chat:" + user.id, 12, 60000);
    const b = await body(req);
    const content = cleanText(b.content, 1, 500, "Message");
    const room = Number(b.room);
    if (!(await db.prepare("SELECT id FROM rooms WHERE id=?").get(room)))
      fail("Room not found.", 404);
    const result = await db
      .prepare("INSERT INTO messages(room_id,user_id,content) VALUES (?,?,?)")
      .run(room, user.id, content);
    return {
      id: Number(result.lastInsertRowid),
    };
  }
  if (p === "/api/daily-reward" && method === "POST") {
    requireUser(user);
    const day = new Date().toISOString().slice(0, 10);
    if (
      await db
        .prepare("SELECT 1 FROM rewards WHERE user_id=? AND day=?")
        .get(user.id, day)
    )
      fail("You already collected today’s coins. Come back tomorrow!");
    await db.transaction(async () => {
      const claimed = await db
        .prepare("INSERT OR IGNORE INTO rewards VALUES (?,?)")
        .run(user.id, day);
      if (!claimed.changes)
        fail("You already collected today’s coins. Come back tomorrow!");
      await db
        .prepare("UPDATE users SET coins=coins+100 WHERE id=?")
        .run(user.id);
    });
    return {
      user: await safeUser(
        await db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
      ),
      message: "100 daily coins collected!",
    };
  }
  if (p === "/api/purchase" && method === "POST") {
    requireUser(user);
    if (!settings.shopEnabled && !isAdmin(user))
      fail("The shop is temporarily closed.", 403);
    const b = await body(req);
    const item = (await getItems()).find((x) => x.id === b.item);
    if (!item || item.hidden) fail("Item not found.", 404);
    if (
      await db
        .prepare("SELECT 1 FROM inventory WHERE user_id=? AND item_id=?")
        .get(user.id, item.id)
    )
      fail("You already own this item.");
    if (user.coins < item.price)
      fail("Not enough coins. Collect your daily reward!");
    await db.transaction(async () => {
      if (
        await db
          .prepare("SELECT 1 FROM inventory WHERE user_id=? AND item_id=?")
          .get(user.id, item.id)
      )
        fail("You already own this item.");
      const debit = await db
        .prepare("UPDATE users SET coins=coins-? WHERE id=? AND coins>=?")
        .run(item.price, user.id, item.price);
      if (!debit.changes) fail("Not enough coins. Collect your daily reward!");
      await db
        .prepare("INSERT INTO inventory VALUES (?,?)")
        .run(user.id, item.id);
      await db
        .prepare("INSERT INTO purchases(user_id,item_id,cost) VALUES (?,?,?)")
        .run(user.id, item.id, item.price);
    });
    return {
      user: await safeUser(
        await db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
      ),
    };
  }
  if (p === "/api/profile" && method === "PATCH") {
    requireUser(user);
    const b = await body(req);
    if (b.username !== undefined) {
      const name = cleanText(b.username, 3, 20, "Username");
      if (!/^[a-zA-Z0-9_]+$/.test(name))
        fail("Use letters, numbers and underscores.");
      if (
        await db
          .prepare(
            "SELECT id FROM users WHERE username=? COLLATE NOCASE AND id!=?",
          )
          .get(name, user.id)
      )
        fail("Username already taken.");
      await db
        .prepare("UPDATE users SET username=? WHERE id=?")
        .run(name, user.id);
    }
    if (b.item) {
      const item = (await getItems()).find((x) => x.id === b.item);
      if (
        !item ||
        !(await db
          .prepare("SELECT 1 FROM inventory WHERE user_id=? AND item_id=?")
          .get(user.id, b.item))
      )
        fail("You must own this item first.");
      await db
        .prepare(
          `UPDATE users SET ${item.type === "theme" ? "theme" : "avatar"}=? WHERE id=?`,
        )
        .run(item.value, user.id);
    }
    if (b.resetTheme)
      await db
        .prepare("UPDATE users SET theme='midnight' WHERE id=?")
        .run(user.id);
    return {
      user: await safeUser(
        await db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
      ),
    };
  }
  if (p === "/api/leaderboard" && method === "GET")
    return {
      players: await db
        .prepare(
          `SELECT users.id,username,avatar,MAX(score) AS score,game FROM scores JOIN users ON user_id=users.id WHERE banned=0 GROUP BY users.id,game ORDER BY score DESC LIMIT 20`,
        )
        .all(),
    };
  if (p === "/api/scores" && method === "POST") {
    requireUser(user);
    rate("score:" + user.id, 10, 60000);
    const b = await body(req);
    if (
      ![
        "wordle",
        "tetris",
        "snake",
        "2048",
        "memory",
        "minesweeper",
        "tic-tac-toe",
        "connect-four",
        "pong",
        "breakout",
        "reaction",
        "quiz",
        "sudoku",
      ].includes(b.game) ||
      !Number.isInteger(b.score) ||
      b.score < 0 ||
      b.score > 1000000
    )
      fail("Invalid score.");
    await db
      .prepare("INSERT INTO scores(user_id,game,score) VALUES (?,?,?)")
      .run(user.id, b.game, b.score);
    return {
      ok: true,
    };
  }
  if (p.startsWith("/api/admin")) {
    requireAdmin(user);
    if (p === "/api/admin" && method === "GET")
      return {
        users: await Promise.all(
          (await db.prepare("SELECT * FROM users ORDER BY id DESC").all()).map(
            safeUser,
          ),
        ),
        audit: await db
          .prepare(
            "SELECT audit.*,users.username FROM audit JOIN users ON actor=users.id ORDER BY audit.id DESC LIMIT 50",
          )
          .all(),
        stats: {
          users: (await db.prepare("SELECT COUNT(*) AS n FROM users").get()).n,
          messages: (
            await db.prepare("SELECT COUNT(*) AS n FROM messages").get()
          ).n,
          purchases: (
            await db.prepare("SELECT COUNT(*) AS n FROM purchases").get()
          ).n,
        },
      };
    const b = await body(req);
    if (p === "/api/admin/settings" && method === "PATCH") {
      const strings = {
        siteName: 40,
        tagline: 140,
        announcement: 500,
        heroTitle: 80,
        heroSubtitle: 180,
      };
      const bools = [
        "announcementEnabled",
        "maintenance",
        "chatEnabled",
        "shopEnabled",
      ];
      for (const [key, value] of Object.entries(b)) {
        if (key in strings) {
          if (typeof value !== "string" || value.length > strings[key])
            fail(`Invalid ${key}.`);
        } else if (bools.includes(key)) {
          if (typeof value !== "boolean") fail(`Invalid ${key}.`);
        } else if (key === "disabledGames") {
          if (
            !Array.isArray(value) ||
            value.length > 50 ||
            value.some((x) => typeof x !== "string" || x.length > 40)
          )
            fail("Invalid game list.");
        } else if (key === "itemOverrides" || key === "gameOverrides") {
          if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value) ||
            Object.keys(value).length > 50
          )
            fail("Invalid catalog overrides.");
          for (const [id, entry] of Object.entries(value)) {
            if (
              !/^[a-z0-9-]{1,40}$/.test(id) ||
              !entry ||
              typeof entry !== "object" ||
              Array.isArray(entry)
            )
              fail("Invalid catalog entry.");
            for (const [field, v] of Object.entries(entry)) {
              if (["name", "description"].includes(field)) {
                if (typeof v !== "string" || v.length > 140)
                  fail("Invalid catalog text.");
              } else if (field === "price" && key === "itemOverrides") {
                if (!Number.isInteger(v) || v < 0 || v > 100000)
                  fail("Invalid price.");
              } else if (field === "hidden" && key === "itemOverrides") {
                if (typeof v !== "boolean") fail("Invalid visibility.");
              } else fail("Unsupported catalog field.");
            }
          }
        } else fail("Unknown setting.");
      }
      for (const [key, value] of Object.entries(b))
        await db
          .prepare("UPDATE settings SET value=? WHERE key=?")
          .run(JSON.stringify(value), key);
      await audit(user.id, "settings", b);
      return {
        settings: await getSettings(),
      };
    }
    if (p === "/api/admin/users" && method === "PATCH") {
      const target = await db
        .prepare("SELECT * FROM users WHERE id=?")
        .get(Number(b.id));
      if (!target) fail("User not found.", 404);
      if (b.banned !== undefined) {
        if (ADMINS.has(target.email)) fail("Owner accounts cannot be banned.");
        if (typeof b.banned !== "boolean") fail("Invalid ban status.");
        await db
          .prepare("UPDATE users SET banned=? WHERE id=?")
          .run(b.banned ? 1 : 0, target.id);
        if (b.banned)
          await db
            .prepare("DELETE FROM sessions WHERE user_id=?")
            .run(target.id);
      }
      if (b.coins !== undefined) {
        if (!Number.isInteger(b.coins) || b.coins < 0 || b.coins > 1000000)
          fail("Coins must be 0–1,000,000.");
        await db
          .prepare("UPDATE users SET coins=? WHERE id=?")
          .run(b.coins, target.id);
      }
      if (b.username !== undefined) {
        const name = cleanText(b.username, 3, 20, "Username");
        if (!/^[a-zA-Z0-9_]+$/.test(name)) fail("Invalid username.");
        if (
          await db
            .prepare(
              "SELECT id FROM users WHERE username=? COLLATE NOCASE AND id!=?",
            )
            .get(name, target.id)
        )
          fail("Username already taken.");
        await db
          .prepare("UPDATE users SET username=? WHERE id=?")
          .run(name, target.id);
      }
      await audit(user.id, "user update", {
        ...b,
      });
      return {
        user: await safeUser(
          await db.prepare("SELECT * FROM users WHERE id=?").get(target.id),
        ),
      };
    }
    if (p === "/api/admin/rooms" && method === "POST") {
      const name = cleanText(b.name, 2, 30, "Room name").toLowerCase();
      if (!/^[a-z0-9-]+$/.test(name))
        fail("Room names use lowercase letters, numbers and hyphens.");
      if (await db.prepare("SELECT id FROM rooms WHERE name=?").get(name))
        fail("Room already exists.");
      await db
        .prepare("INSERT INTO rooms(name,description) VALUES (?,?)")
        .run(
          name,
          cleanText(
            b.description || "A new place to hang out.",
            1,
            140,
            "Description",
          ),
        );
      await audit(user.id, "room created", {
        name,
      });
      return {
        rooms: await db.prepare("SELECT * FROM rooms").all(),
      };
    }
    if (p === "/api/admin/rooms" && method === "PATCH") {
      const room = await db
        .prepare("SELECT * FROM rooms WHERE id=?")
        .get(Number(b.id));
      if (!room) fail("Room not found.");
      const name = cleanText(b.name, 2, 30, "Room name").toLowerCase();
      if (
        !/^[a-z0-9-]+$/.test(name) ||
        (await db
          .prepare("SELECT id FROM rooms WHERE name=? AND id!=?")
          .get(name, room.id))
      )
        fail("Room name invalid or already taken.");
      await db
        .prepare("UPDATE rooms SET name=?,description=? WHERE id=?")
        .run(
          name,
          cleanText(
            b.description || "A place to hang out.",
            1,
            140,
            "Description",
          ),
          room.id,
        );
      await audit(user.id, "room edited", b);
      return {
        rooms: await db.prepare("SELECT * FROM rooms").all(),
      };
    }
    if (p === "/api/admin/rooms" && method === "DELETE") {
      if (Number(b.id) === 1) fail("Keep the general room.");
      await db
        .prepare("DELETE FROM messages WHERE room_id=?")
        .run(Number(b.id));
      await db.prepare("DELETE FROM rooms WHERE id=?").run(Number(b.id));
      await audit(user.id, "room deleted", b);
      return {
        rooms: await db.prepare("SELECT * FROM rooms").all(),
      };
    }
    if (p === "/api/admin/messages" && method === "DELETE") {
      if (b.room) {
        await db
          .prepare("DELETE FROM messages WHERE room_id=?")
          .run(Number(b.room));
      } else
        await db.prepare("DELETE FROM messages WHERE id=?").run(Number(b.id));
      await audit(user.id, "messages removed", b);
      return {
        ok: true,
      };
    }
    fail("Admin operation not found.", 404);
  }
  fail("Not found.", 404);
}
let vite;
if (process.env.NODE_ENV !== "production") {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    appType: "spa",
  });
}
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
      const result = await api(req, res, url);
      if (!res.writableEnded) {
        res.writeHead(200, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(result));
      }
      return;
    }
    if (vite) {
      vite.middlewares(req, res);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) fail("Method not allowed.", 405);
    const dist = path.join(root, "dist");
    const candidate = path.resolve(
      dist,
      "." + decodeURIComponent(url.pathname),
    );
    if (!candidate.startsWith(dist + path.sep) && candidate !== dist)
      fail("Not found.", 404);
    const file =
      existsSync(candidate) && statSync(candidate).isFile()
        ? candidate
        : path.join(dist, "index.html");
    const type =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".woff2": "font/woff2",
      }[path.extname(file)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
    });
    res.end(req.method === "HEAD" ? undefined : readFileSync(file));
  } catch (error) {
    if (res.writableEnded) return;
    res.writeHead(error.status || 500, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error: error.status
          ? error.message
          : "Something went wrong. Please try again.",
      }),
    );
    if (!error.status) console.error("Request failed:", error.name);
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`Pixel Playground running on port ${port}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
