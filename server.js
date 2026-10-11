import http from "node:http";
import { openDatabase } from "./src/database.js";
import { createBackend } from "./src/backend.js";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export { ADMINS, ITEMS } from "./src/backend.js";
http.setGlobalProxyFromEnv?.();
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
if (
  (process.env.VERCEL || process.env.REQUIRE_REMOTE_DATABASE === "true") &&
  !process.env.PIXEL_DATABASE_URL &&
  !process.env.SUPABASE_DB_URL &&
  !process.env.TURSO_DATABASE_URL
)
  throw new Error(
    "This deployment requires SUPABASE_DB_URL or TURSO_DATABASE_URL and TURSO_AUTH_TOKEN; local storage is temporary.",
  );
process.env.APP_URL ||=
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);
const db = openDatabase({
  postgresUrl: process.env.PIXEL_DATABASE_URL || process.env.SUPABASE_DB_URL,
  file: process.env.DATABASE_PATH || path.join(root, "data/pixel.db"),
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
if (!db.remote)
  await db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
const backendHandler = await createBackend(db);
function fail(message, status) {
  throw Object.assign(new Error(message), { status });
}

let vite;
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
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
export async function requestHandler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Google Sites checks embed headers; leave framing unrestricted.
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
      return backendHandler(req, res);
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
}
if (
  !process.env.VERCEL &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = http.createServer(requestHandler);
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
}
