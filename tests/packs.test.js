import test from "node:test";
import assert from "node:assert/strict";
import {
  PACKS,
  PACK_AVATARS,
  RARITIES,
  DEFAULT_PACK_CHANCES,
  eligiblePackItems,
  packOdds,
  validPackChances,
  packReady,
  choosePackRarity,
} from "../src/avatarPacks.js";
test("twelve themed packs contain 120 distinct avatars across all six rarities", () => {
  assert.equal(PACKS.length, 12);
  assert.equal(PACK_AVATARS.length, 120);
  assert.equal(new Set(PACK_AVATARS.map((a) => a.id)).size, 120);
  assert.equal(new Set(PACK_AVATARS.map((a) => a.value)).size, 120);
  for (const pack of PACKS) {
    const items = eligiblePackItems(pack.id, PACK_AVATARS);
    assert.equal(items.length, 10);
    assert.equal(new Set(items.map((i) => i.rarity)).size, 6);
    assert.ok(packReady(items, pack.chances));
  }
});
test("all 10000 independent draw outcomes exactly match configured percentages", () => {
  const count = Object.fromEntries(Object.keys(RARITIES).map((k) => [k, 0]));
  for (let roll = 0; roll < 10000; roll++)
    count[choosePackRarity(DEFAULT_PACK_CHANCES, roll)]++;
  assert.deepEqual(count, {
    uncommon: 6000,
    rare: 2500,
    epic: 1000,
    legendary: 400,
    mystical: 90,
    op: 10,
  });
  for (let i = 0; i < 20; i++)
    assert.equal(choosePackRarity(DEFAULT_PACK_CHANCES, 9999), "op");
  assert.equal(packOdds()[5].chance, 0.1);
});
test("chance settings reject missing, extra, negative, non-finite and non-100 totals", () => {
  assert.ok(validPackChances(DEFAULT_PACK_CHANCES));
  for (const value of [
    null,
    {},
    [],
    { ...DEFAULT_PACK_CHANCES, op: 1 },
    { ...DEFAULT_PACK_CHANCES, extra: 0 },
    { ...DEFAULT_PACK_CHANCES, uncommon: -1 },
    { ...DEFAULT_PACK_CHANCES, op: NaN },
    { ...DEFAULT_PACK_CHANCES, op: 0.10001 },
  ])
    assert.ok(!validPackChances(value));
});
test("hidden contents cannot silently change rarity odds", () => {
  const pack = PACKS[0],
    items = eligiblePackItems(
      pack.id,
      PACK_AVATARS.map((i) => ({ ...i, hidden: i.rarity === "op" })),
    );
  assert.equal(packReady(items, pack.chances), false);
  const chances = {
    uncommon: 100,
    rare: 0,
    epic: 0,
    legendary: 0,
    mystical: 0,
    op: 0,
  };
  assert.equal(packReady(items, chances), true);
  assert.equal(choosePackRarity(chances, 9999), "uncommon");
  assert.throws(() => choosePackRarity(chances, 10000));
});
