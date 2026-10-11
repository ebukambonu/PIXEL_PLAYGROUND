import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMigrationUsers } from "../src/migration.js";

test("legacy migration preserves ordinary players and both eligible owners", () => {
  const users = [
    { id: 1, username: "Player", email: "player@example.com", password: "keep-hash", coins: 900 },
    { id: 2, username: "OldFirstOwner", email: "somkene.ebukambonu@millburnacademy.org.uk", verified: 0 },
    { id: 3, username: "OldSecondOwner", email: "kamneto.ebukambonu@millburnacademy.org.uk", verified: 1 },
  ];
  const migrated = normalizeMigrationUsers(users);
  assert.equal(migrated[0].role, "player");
  assert.equal(migrated[0].password, "keep-hash");
  assert.equal(migrated[0].coins, 900);
  assert.equal(migrated[1].role, "admin");
  assert.equal(migrated[1].username, "Somkene");
  assert.equal(migrated[2].role, "admin");
  assert.equal(migrated[2].username, "Kamneto");
  assert.equal(users[0].role, undefined);
  assert.equal(users[1].username, "OldFirstOwner");
});
test("migration does not grant admin from email when a role already exists", () => {
  const [user] = normalizeMigrationUsers([{ id: 1, username: "Player", role: "player", email: "somkene.ebukambonu@millburnacademy.org.uk" }]);
  assert.equal(user.role, "player");
  assert.equal(user.username, "Player");
});
test("migration refuses to overwrite a player using a reserved owner name", () => {
  assert.throws(() => normalizeMigrationUsers([
    { id: 1, username: "somkene", email: "player@example.com" },
    { id: 2, username: "OldOwner", email: "somkene.ebukambonu@millburnacademy.org.uk" },
  ]), /conflicts/);
});
