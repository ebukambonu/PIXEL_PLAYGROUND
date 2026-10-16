import test from "node:test";
import assert from "node:assert/strict";
import {
  newDefense,
  buildTower,
  startWave,
  defenseTick,
  ROUTE,
  newGems,
  findMatches,
  hasGemMove,
  swapGems,
  newDungeon,
  dungeonStep,
} from "../src/advancedLogic.js";
function random(seed = 193) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("defense enforces path, currency and upgrade limits without mutating state", () => {
  const s = newDefense();
  assert.equal(buildTower(s, 0, 2), s);
  let n = buildTower(s, 1, 1);
  assert.equal(n.gold, 120);
  assert.equal(s.towers.length, 0);
  n = buildTower(n, 1, 1);
  assert.equal(n.towers[0].level, 2);
  assert.equal(n.gold, 55);
  assert.equal(buildTower(n, 1, 1), n);
  n = buildTower({ ...n, gold: 1000 }, 1, 1);
  assert.equal(n.towers[0].level, 3);
  assert.equal(buildTower(n, 1, 1), n);
});
test("defense cannot double-start a wave and records escaping enemies", () => {
  let s = startWave(newDefense());
  assert.equal(startWave(s), s);
  s = {
    ...s,
    lives: 1,
    queue: 0,
    enemies: [
      { id: 1, p: ROUTE.length - 1.1, hp: 1, max: 1, speed: 1, slow: 0 },
    ],
  };
  s = defenseTick(s, 1);
  assert.equal(s.status, "lost");
  assert.equal(s.lives, 0);
});
test("defense pays a kill once and clears final wave", () => {
  let s = {
    ...newDefense(),
    wave: 10,
    active: true,
    queue: 0,
    towers: [{ x: 1, y: 1, level: 3, type: "pulse", cool: 0 }],
    enemies: [{ id: 1, p: 1, hp: 1, max: 1, speed: 0, slow: 0 }],
  };
  s = defenseTick(s, 0.1);
  assert.equal(s.status, "won");
  assert.equal(s.gold, 237);
  assert.equal(defenseTick(s, 0.1), s);
});
test("gem boards start settled with a legal move; cascades settle and preserve tile bounds", () => {
  const rng = random();
  for (let i = 0; i < 40; i++) {
    const b = newGems(rng);
    assert.equal(findMatches(b).length, 0);
    assert.equal(hasGemMove(b), true);
    let result;
    outer: for (let a = 0; a < 64; a++)
      for (const d of [1, 8]) {
        if (a + d >= 64) continue;
        const r = swapGems(b, a, a + d, rng);
        if (r.points) {
          result = r;
          break outer;
        }
      }
    assert.ok(result.points >= 75);
    assert.equal(findMatches(result.board).length, 0);
    assert.ok(result.board.every((v) => v >= 0 && v < 6));
    assert.ok(hasGemMove(result.board));
  }
});
test("gem swaps cannot wrap rows or charge a non-matching swap", () => {
  const b = newGems(random());
  assert.equal(swapGems(b, 7, 8).points, 0);
  assert.equal(swapGems(b, 0, 0).board, b);
});
test("dungeon walls cost no turn, potions consume a turn, and stairs require guardians cleared", () => {
  let s = newDungeon(1, null, random());
  s = {
    ...s,
    pos: 1,
    enemies: [],
    walls: s.walls.map((v, i) => (i === 2 ? true : v)),
  };
  assert.equal(dungeonStep(s, "right"), s);
  s = { ...s, hp: 10, potions: 1 };
  let n = dungeonStep(s, "heal");
  assert.equal(n.hp, 30);
  assert.equal(n.potions, 0);
  n = dungeonStep({ ...s, pos: 79, enemies: [], hp: 30 }, "right");
  assert.equal(n.status, "upgrade");
  n = dungeonStep({ ...s, floor: 5, pos: 79, enemies: [], hp: 30 }, "right");
  assert.equal(n.status, "won");
});
test("dungeon attacks resolve before enemy movement and award a kill once", () => {
  const s = {
    ...newDungeon(1, null, random()),
    pos: 1,
    enemies: [{ id: 1, pos: 10, hp: 2 }],
    attack: 7,
  };
  const n = dungeonStep(s, "down");
  assert.equal(n.enemies.length, 0);
  assert.equal(n.score, 120);
  assert.equal(n.pos, 1);
  assert.equal(s.enemies[0].hp, 2);
});
