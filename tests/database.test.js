import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { openDatabase } from "../src/database.js";

test("async database adapter preserves existing SQLite records", async () => {
  const dir = mkdtempSync("/tmp/pixel-db-"),
    file = dir + "/data.db";
  const original = new DatabaseSync(file);
  original.exec(
    "CREATE TABLE records(id INTEGER PRIMARY KEY,value TEXT); INSERT INTO records VALUES (1,'existing')",
  );
  original.close();
  const db = openDatabase({ file });
  try {
    assert.equal(
      (await db.prepare("SELECT value FROM records WHERE id=?").get(1)).value,
      "existing",
    );
    await db.prepare("INSERT INTO records(value) VALUES (?)").run("new");
    assert.equal((await db.prepare("SELECT * FROM records").all()).length, 2);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("database transactions roll back errors and serialize concurrent writes", async () => {
  const dir = mkdtempSync("/tmp/pixel-tx-"),
    db = openDatabase({ file: dir + "/data.db" });
  try {
    await db.exec(
      "CREATE TABLE balances(id INTEGER PRIMARY KEY,coins INTEGER); INSERT INTO balances VALUES(1,500)",
    );
    await assert.rejects(
      db.transaction(async () => {
        await db.prepare("UPDATE balances SET coins=0").run();
        throw new Error("rollback");
      }),
      /rollback/,
    );
    assert.equal(
      (await db.prepare("SELECT coins FROM balances").get()).coins,
      500,
    );
    await Promise.all(
      Array.from({ length: 8 }, () =>
        db.transaction(async () => {
          const row = await db
            .prepare("SELECT coins FROM balances WHERE id=1")
            .get();
          await db
            .prepare("UPDATE balances SET coins=? WHERE id=1")
            .run(row.coins + 1);
        }),
      ),
    );
    assert.equal(
      (await db.prepare("SELECT coins FROM balances").get()).coins,
      508,
    );
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("remote configuration rejects insecure URLs and missing authentication", () => {
  assert.throws(
    () => openDatabase({ url: "http://database.example", authToken: "test" }),
    /secure/,
  );
  assert.throws(
    () => openDatabase({ url: "libsql://database.example" }),
    /AUTH_TOKEN/,
  );
});
