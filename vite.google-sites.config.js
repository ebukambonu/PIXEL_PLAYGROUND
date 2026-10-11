import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.VITE_API_BASE_URL
    ? new URL(
        "/storage/v1/object/public/pixel-assets/",
        process.env.VITE_API_BASE_URL,
      ).href
    : "/",
  build: { outDir: "dist-google-sites" },
});
