import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base = process.env.VITE_API_BASE_URL;
if (
  !base ||
  !/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/pixel-playground\/?$/.test(
    base,
  )
)
  throw new Error(
    "Set VITE_API_BASE_URL to https://YOUR_PROJECT.supabase.co/functions/v1/pixel-playground (no secret key).",
  );
execFileSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--config",
    "vite.google-sites.config.js",
  ],
  { stdio: "inherit" },
);
const assets = "dist-google-sites/assets";
const files = readdirSync(assets);
const storage = new URL("/storage/v1/object/public/pixel-assets/assets/", base)
  .href;
const styles = files
  .filter((file) => file.endsWith(".css"))
  .map((file) => `<link rel="stylesheet" href="${storage + file}">`)
  .join("");
const scripts = files
  .filter((file) => file.endsWith(".js"))
  .map(
    (file) =>
      `<script type="module" crossorigin src="${storage + file}"></script>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Playground</title>${styles}</head><body><div id="root"></div>${scripts}</body></html>`;
writeFileSync("dist-google-sites/GOOGLE_SITES_APP.html", html);
console.log(
  "Built dist-google-sites/GOOGLE_SITES_APP.html. Upload the assets using npm run publish:google-sites, then paste this HTML into Google Sites → Embed code.",
);
