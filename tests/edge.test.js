import test from "node:test";
import assert from "node:assert/strict";
import { createEdgeHandler } from "../src/edgeHandler.js";

test("Edge uses bearer sessions and ignores ambient cookies", async () => {
  const token = "a".repeat(64);
  const seen = [];
  const handler = createEdgeHandler(async () => ({
    requestHandler: async (req, res) => {
      seen.push(req);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    },
  }));
  const headers = {
    Cookie: `pixel_session=${token}`,
    Origin: "https://sites.google.com",
  };
  await handler(
    new Request(
      "https://project.supabase.co/functions/v1/pixel-playground/api/bootstrap",
      { headers },
    ),
  );
  assert.equal(seen[0].headers.cookie, undefined);
  const response = await handler(
    new Request(
      "https://project.supabase.co/functions/v1/pixel-playground/api/admin/settings",
      {
        method: "PATCH",
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    ),
  );
  assert.equal(seen[1].headers.cookie, `pixel_session=${token}`);
  assert.equal(seen[1].url, "/api/admin/settings");
  assert.equal(seen[1].headers.origin, undefined);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});
test("Edge returns login tokens and supports Google Sites preflight", async () => {
  const token = "b".repeat(64);
  const handler = createEdgeHandler(async () => ({
    requestHandler: async (_req, res) => {
      res.setHeader("Set-Cookie", `pixel_session=${token}; HttpOnly`);
      res.end(JSON.stringify({ user: { username: "Player" } }));
    },
  }));
  const options = await handler(
    new Request("https://project.supabase.co/api/login", { method: "OPTIONS" }),
  );
  assert.equal(options.status, 204);
  const response = await handler(
    new Request("https://project.supabase.co/api/login", {
      method: "POST",
      body: "{}",
    }),
  );
  assert.equal((await response.json()).sessionToken, token);
  assert.equal(response.headers.get("set-cookie"), null);
});
