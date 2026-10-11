import { writeFileSync } from "node:fs";
import path from "node:path";
import { openDatabase } from "../src/database.js";
import { migrateToSupabase } from "../src/migration.js";

let source, target;
try {
  if (!process.env.SUPABASE_DB_URL)
    throw new Error("SUPABASE_DB_URL is required.");
  if (!process.env.TURSO_DATABASE_URL && !process.env.MIGRATION_SQLITE_PATH)
    throw new Error(
      "Set TURSO_DATABASE_URL/TURSO_AUTH_TOKEN or MIGRATION_SQLITE_PATH.",
    );
  source = openDatabase({
    file: process.env.MIGRATION_SQLITE_PATH,
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  target = openDatabase({ postgresUrl: process.env.SUPABASE_DB_URL });
  const backup =
    process.env.MIGRATION_BACKUP_PATH ||
    path.join("/tmp", `pixel-before-supabase-${Date.now()}.json`);
  const counts = await migrateToSupabase(source, target, async (data) => {
    writeFileSync(
      backup,
      JSON.stringify({
        version: 1,
        created: new Date().toISOString(),
        tables: data,
      }),
      { mode: 0o600, flag: "wx" },
    );
    console.log("Private backup saved at:", backup);
  });
  console.log("Migration committed and row counts verified:", counts);
  console.log(
    "Keep the source database and private backup until the new site is verified.",
  );
} catch (error) {
  // Database errors can contain connection details; print no secret-bearing payload.
  console.error(
    "Migration did not complete. Check secure connection settings, source schema, and that the destination is empty.",
  );
  if (
    /required|Set TURSO|not empty|count verification|column name/.test(
      error.message,
    )
  )
    console.error(error.message);
  else console.error("Error code:", error.code || error.name);
  process.exitCode = 1;
} finally {
  await source?.close();
  await target?.close();
}
