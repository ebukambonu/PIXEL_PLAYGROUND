import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(base) || !key)
  throw new Error(
    "Set SUPABASE_URL and the private SUPABASE_SERVICE_ROLE_KEY securely, not in Google Sites.",
  );
const compiled = readFileSync(
  "dist-google-sites/GOOGLE_SITES_APP.html",
  "utf8",
);
if (!compiled.includes(base.replace(/\/$/, "") + "/storage/"))
  throw new Error(
    "Build the Google Sites HTML for this Supabase project before uploading.",
  );
const headers = { apikey: key, Authorization: `Bearer ${key}` };
async function request(endpoint, options = {}) {
  return fetch(base.replace(/\/$/, "") + "/storage/v1" + endpoint, {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(30000),
  });
}
let bucket = await request("/bucket/pixel-assets");
if (bucket.status === 404 || bucket.status === 400) {
  const created = await request("/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "pixel-assets",
      name: "pixel-assets",
      public: true,
    }),
  });
  if (!created.ok)
    throw new Error(`Cannot create asset bucket (HTTP ${created.status}).`);
} else {
  if (!bucket.ok)
    throw new Error(`Cannot read asset bucket (HTTP ${bucket.status}).`);
  if (!(await bucket.json()).public)
    throw new Error(
      "pixel-assets exists but is private. Choose a dedicated public bucket for website assets.",
    );
}
const mime = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const assets = "dist-google-sites/assets";
for (const file of readdirSync(assets)) {
  const uploaded = await request(
    "/object/pixel-assets/assets/" + encodeURIComponent(file),
    {
      method: "POST",
      headers: {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "x-upsert": "true",
        "cache-control": "31536000",
      },
      body: readFileSync(path.join(assets, file)),
    },
  );
  if (!uploaded.ok)
    throw new Error(`Asset upload failed (HTTP ${uploaded.status}).`);
}
console.log(
  "Public website assets uploaded. Paste dist-google-sites/GOOGLE_SITES_APP.html into Google Sites. No database files or secrets were uploaded.",
);
