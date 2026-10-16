export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, verified INTEGER DEFAULT 0, banned INTEGER DEFAULT 0, coins INTEGER DEFAULT 500, avatar TEXT DEFAULT '👾', theme TEXT DEFAULT 'midnight', role TEXT DEFAULT 'player', display_role TEXT DEFAULT 'gamer', earned_op INTEGER DEFAULT 0, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER);
CREATE TABLE IF NOT EXISTS verifications(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires INTEGER);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY, name TEXT UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, room_id INTEGER REFERENCES rooms(id), user_id INTEGER REFERENCES users(id), content TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS inventory(user_id INTEGER REFERENCES users(id), item_id TEXT, PRIMARY KEY(user_id,item_id));
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), item_id TEXT, cost INTEGER, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pack_openings(request_id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), pack_id TEXT NOT NULL, item_id TEXT NOT NULL, cost INTEGER NOT NULL, duplicate INTEGER DEFAULT 0, refund INTEGER DEFAULT 0, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rewards(user_id INTEGER REFERENCES users(id), day TEXT, PRIMARY KEY(user_id,day));
CREATE TABLE IF NOT EXISTS scores(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), game TEXT, score INTEGER, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS rate_limits_key_expires ON rate_limits(key, expires);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, actor INTEGER REFERENCES users(id), action TEXT, details TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);`;

export async function ensureSchema(db) {
  await db.exec(SCHEMA_SQL);
  if (db.postgres) {
    await db.exec(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player'",
    );
    await db.exec(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_role TEXT DEFAULT 'gamer'",
    );
    const hadEarnedOP = await db
      .prepare(
        "SELECT 1 AS present FROM information_schema.columns WHERE table_schema='pixel_playground' AND table_name='users' AND column_name='earned_op'",
      )
      .get();
    await db.exec(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS earned_op INTEGER DEFAULT 0",
    );
    if (!hadEarnedOP)
      await db
        .prepare("UPDATE users SET display_role='owner' WHERE role='admin'")
        .run();
  } else {
    const columns = await db.prepare("PRAGMA table_info(users)").all();
    if (!columns.some((column) => column.name === "earned_op"))
      await db.exec("ALTER TABLE users ADD COLUMN earned_op INTEGER DEFAULT 0");
    if (!columns.some((column) => column.name === "display_role"))
      await db.exec(
        "ALTER TABLE users ADD COLUMN display_role TEXT DEFAULT 'gamer'",
      );
    if (!columns.some((column) => column.name === "role")) {
      await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'player'");
      // Upgrade only existing legacy owners, never newly registered email claims.
      await db
        .prepare(
          "UPDATE users SET role='admin' WHERE email=? OR (email=? AND verified=1)",
        )
        .run(
          "somkene.ebukambonu@millburnacademy.org.uk",
          "kamneto.ebukambonu@millburnacademy.org.uk",
        );
    }
    if (!columns.some((column) => column.name === "earned_op"))
      await db
        .prepare("UPDATE users SET display_role='owner' WHERE role='admin'")
        .run();
  }
}
