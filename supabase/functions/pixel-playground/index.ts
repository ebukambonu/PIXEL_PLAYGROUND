import process from "node:process";
import { createEdgeHandler } from "../../../src/edgeHandler.js";
import { createBackend } from "../../../src/backend.js";
import { openPostgres } from "../../../src/postgres.js";

process.env.NODE_ENV = "production";
Deno.serve(
  { port: Number(Deno.env.get("PORT") || 8000) },
  createEdgeHandler(async () => {
    const url =
      Deno.env.get("PIXEL_DATABASE_URL") || Deno.env.get("SUPABASE_DB_URL");
    if (!url)
      throw new Error(
        "Configure PIXEL_DATABASE_URL for the Supabase database.",
      );
    const db = openPostgres(url);
    try {
      return { requestHandler: await createBackend(db) };
    } catch (error) {
      await db.close();
      throw error;
    }
  }),
);
