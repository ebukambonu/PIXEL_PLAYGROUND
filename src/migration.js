import { ensureSchema } from "./schema.js";

export const MIGRATION_TABLES = [
  "users",
  "rooms",
  "settings",
  "sessions",
  "verifications",
  "messages",
  "inventory",
  "purchases",
  "rewards",
  "scores",
  "audit",
  "rate_limits",
  "pack_openings",
];

export function normalizeMigrationUsers(users) {
  const result = users.map((user) => ({ ...user }));
  for (const user of result) {
    if (user.role === undefined) {
      user.role =
        user.email === "somkene.ebukambonu@millburnacademy.org.uk" ||
        (user.email === "kamneto.ebukambonu@millburnacademy.org.uk" &&
          user.verified)
          ? "admin"
          : "player";
    }
    const desired =
      user.role === "admin" &&
      user.email === "somkene.ebukambonu@millburnacademy.org.uk"
        ? "Somkene"
        : user.role === "admin" &&
            user.email === "kamneto.ebukambonu@millburnacademy.org.uk"
          ? "Kamneto"
          : null;
    if (desired) {
      if (
        result.some(
          (other) =>
            other.id !== user.id &&
            other.username.toLowerCase() === desired.toLowerCase(),
        )
      )
        throw new Error(
          "Reserved admin name conflicts with an existing player; migration stopped.",
        );
      user.username = desired;
    }
  }
  return result;
}

export async function migrateToSupabase(source, target, saveBackup) {
  if (!target.postgres)
    throw new Error("Migration destination must be PostgreSQL.");
  // Take a consistent snapshot. Stop the old app before running this migration
  // so new writes cannot occur between this snapshot and the hosting switch.
  const snapshot = await source.transaction(async () => {
    const data = {};
    for (const table of MIGRATION_TABLES)
      try {
        data[table] = await source.prepare(`SELECT * FROM ${table}`).all();
      } catch (error) {
        if (
          table === "pack_openings" &&
          /no such table|does not exist/.test(error.message)
        )
          data[table] = [];
        else throw error;
      }
    return data;
  });
  await saveBackup(snapshot);
  await ensureSchema(target);
  return target.transaction(async () => {
    for (const table of MIGRATION_TABLES) {
      const count = await target
        .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
        .get();
      if (Number(count.count))
        throw new Error("Destination is not empty. No records were replaced.");
    }
    snapshot.users = normalizeMigrationUsers(snapshot.users);
    const counts = {};
    for (const table of MIGRATION_TABLES) {
      const rows = snapshot[table];
      if (rows.length) {
        const columns = Object.keys(rows[0]);
        if (!columns.every((column) => /^[a-z_][a-z_0-9]*$/.test(column)))
          throw new Error("Unexpected source column name.");
        for (let index = 0; index < rows.length; index += 100) {
          const batch = rows.slice(index, index + 100);
          const placeholders = batch
            .map(() => `(${columns.map(() => "?").join(",")})`)
            .join(",");
          await target
            .prepare(
              `INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders}`,
            )
            .run(
              ...batch.flatMap((row) => columns.map((column) => row[column])),
            );
        }
      }
      const count = await target
        .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
        .get();
      if (Number(count.count) !== rows.length)
        throw new Error("Migration count verification failed.");
      counts[table] = rows.length;
      if (
        ["users", "rooms", "messages", "purchases", "scores", "audit"].includes(
          table,
        )
      )
        await target
          .prepare(
            `SELECT setval(pg_get_serial_sequence('pixel_playground.${table}', 'id'), COALESCE(MAX(id),1), COUNT(*)>0) FROM ${table}`,
          )
          .get();
    }
    return counts;
  });
}
