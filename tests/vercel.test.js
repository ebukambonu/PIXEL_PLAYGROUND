import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHandler } from "../api/index.js";

const response = () => ({
  headers: {},
  writableEnded: false,
  setHeader(key, value) {
    this.headers[key] = value;
  },
  end(value) {
    this.body = value;
    this.writableEnded = true;
  },
});
test("Vercel adapter preserves verification tokens and loads backend once", async () => {
  let loads = 0;
  const seen = [];
  const handler = createHandler(async () => {
    loads++;
    return {
      requestHandler: async (req, res) => {
        seen.push(req.url);
        res.end("ok");
      },
    };
  });
  await Promise.all([
    handler({ url: "/api/index?__route=verify&token=abc123" }, response()),
    handler({ url: "/api/index?__route=admin%2Fsettings" }, response()),
  ]);
  assert.equal(loads, 1);
  assert.deepEqual(seen, ["/api/verify?token=abc123", "/api/admin/settings"]);
});
test("Vercel adapter rejects malformed rewrites and retries initialization failures", async () => {
  let loads = 0;
  const handler = createHandler(async () => {
    if (++loads === 1) throw new Error("Database unavailable");
    return { requestHandler: async (_req, res) => res.end("ok") };
  });
  const bad = response();
  await handler({ url: "/api/index?__route=..%2Fsecrets" }, bad);
  assert.equal(bad.statusCode, 400);
  assert.equal(loads, 0);
  const failed = response();
  await handler({ url: "/api/index?__route=bootstrap" }, failed);
  assert.equal(failed.statusCode, 503);
  assert.ok(!failed.body.includes("Database unavailable"));
  const retry = response();
  await handler({ url: "/api/index?__route=bootstrap" }, retry);
  assert.equal(retry.body, "ok");
  assert.equal(loads, 2);
});
test("Vercel refuses ephemeral local account storage without Turso", () => {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "await import('./server.js')"],
    {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        VERCEL: "1",
        TURSO_DATABASE_URL: "",
        TURSO_AUTH_TOKEN: "",
        REQUIRE_REMOTE_DATABASE: "false",
      },
      encoding: "utf8",
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires TURSO_DATABASE_URL/);
});
