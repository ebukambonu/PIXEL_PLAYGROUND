export const ROUTE = [
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2],
  [3, 3],
  [3, 4],
  [4, 4],
  [5, 4],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [7, 1],
  [8, 1],
  [9, 1],
];
export function pathPosition(progress) {
  const i = Math.min(ROUTE.length - 2, Math.floor(progress));
  const t = Math.min(1, progress - i);
  return {
    x: ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t,
    y: ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t,
  };
}
export function newDefense() {
  return {
    gold: 180,
    lives: 15,
    wave: 0,
    towers: [],
    enemies: [],
    queue: 0,
    timer: 0,
    active: false,
    status: "playing",
    score: 0,
    nextId: 1,
    shots: [],
  };
}
export function startWave(s) {
  if (s.active || s.status !== "playing") return s;
  return {
    ...s,
    wave: s.wave + 1,
    queue: 5 + s.wave * 2,
    timer: 0,
    active: true,
  };
}
export function buildTower(s, x, y, type = "pulse") {
  const old = s.towers.find((t) => t.x === x && t.y === y);
  const cost = old ? old.level * 65 : type === "frost" ? 80 : 60;
  if (
    s.status !== "playing" ||
    s.gold < cost ||
    ROUTE.some((p) => p[0] === x && p[1] === y) ||
    old?.level === 3
  )
    return s;
  return {
    ...s,
    gold: s.gold - cost,
    towers: old
      ? s.towers.map((t) => (t === old ? { ...t, level: t.level + 1 } : t))
      : [...s.towers, { x, y, type, level: 1, cool: 0 }],
  };
}
export function defenseTick(state, dt) {
  if (!state.active || state.status !== "playing") return state;
  const s = {
    ...state,
    towers: state.towers.map((t) => ({ ...t })),
    enemies: state.enemies.map((e) => ({ ...e })),
    shots: state.shots
      .map((x) => ({ ...x, life: x.life - dt }))
      .filter((x) => x.life > 0),
  };
  s.timer -= dt;
  if (s.queue > 0 && s.timer <= 0) {
    const boss = s.wave % 3 === 0 && s.queue === 1;
    const hp = (20 + s.wave * 11) * (boss ? 5 : 1);
    s.enemies.push({
      id: s.nextId++,
      p: 0,
      hp,
      max: hp,
      speed: (0.65 + s.wave * 0.045) * (boss ? 0.65 : 1),
      slow: 0,
      boss,
    });
    s.queue--;
    s.timer = 0.8;
  }
  for (const e of s.enemies) {
    e.p += dt * e.speed * (e.slow > 0 ? 0.45 : 1);
    e.slow = Math.max(0, e.slow - dt);
  }
  for (const t of s.towers) {
    t.cool -= dt;
    if (t.cool > 0) continue;
    const range = 2.35 + t.level * 0.2;
    const target = s.enemies
      .filter((e) => e.hp > 0 && e.p < ROUTE.length - 1)
      .sort((a, b) => b.p - a.p)
      .find((e) => {
        const p = pathPosition(e.p);
        return Math.hypot(p.x - t.x, p.y - t.y) <= range;
      });
    if (target) {
      target.hp -= t.type === "frost" ? 7 * t.level : 15 * t.level;
      if (t.type === "frost") target.slow = 1.6;
      t.cool = 0.7 / (1 + t.level * 0.15);
      s.shots.push({
        x: t.x,
        y: t.y,
        ...{ to: pathPosition(target.p) },
        life: 0.15,
        type: t.type,
      });
    }
  }
  s.enemies = s.enemies.filter((e) => {
    if (e.hp <= 0) {
      s.gold += e.boss ? 65 : 12;
      s.score += e.boss ? 250 : 40;
      return false;
    }
    if (e.p >= ROUTE.length - 1) {
      s.lives -= e.boss ? 3 : 1;
      return false;
    }
    return true;
  });
  if (s.lives <= 0) {
    s.lives = 0;
    s.status = "lost";
    s.active = false;
  } else if (!s.queue && !s.enemies.length) {
    s.active = false;
    s.gold += 45;
    s.score += s.wave * 100;
    if (s.wave === 10) s.status = "won";
  }
  return s;
}
export function adjacent(a, b, size = 8) {
  return (
    Math.abs((a % size) - (b % size)) +
      Math.abs(Math.floor(a / size) - Math.floor(b / size)) ===
    1
  );
}
export function findMatches(b) {
  const set = new Set();
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const i = y * 8 + x;
      if (b[i] < 0) continue;
      if (x < 6 && b[i] === b[i + 1] && b[i] === b[i + 2]) {
        let z = x;
        while (z < 8 && b[y * 8 + z] === b[i]) set.add(y * 8 + z++);
      }
      if (y < 6 && b[i] === b[i + 8] && b[i] === b[i + 16]) {
        let z = y;
        while (z < 8 && b[z * 8 + x] === b[i]) set.add(z++ * 8 + x);
      }
    }
  return [...set];
}
export function hasGemMove(b) {
  for (let i = 0; i < 64; i++)
    for (const j of [i + 1, i + 8]) {
      if (j >= 64 || !adjacent(i, j)) continue;
      const n = [...b];
      [n[i], n[j]] = [n[j], n[i]];
      if (findMatches(n).length) return true;
    }
  return false;
}
export function newGems(random = Math.random) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const b = [];
    for (let i = 0; i < 64; i++) {
      const choices = [0, 1, 2, 3, 4, 5].filter(
        (v) =>
          !(i % 8 >= 2 && b[i - 1] === v && b[i - 2] === v) &&
          !(i >= 16 && b[i - 8] === v && b[i - 16] === v),
      );
      b.push(choices[Math.floor(random() * choices.length)]);
    }
    if (hasGemMove(b)) return b;
  }
  throw Error("Could not make a playable board");
}
export function swapGems(board, a, b, random = Math.random) {
  if (!adjacent(a, b)) return { board, points: 0, chains: 0 };
  let n = [...board];
  [n[a], n[b]] = [n[b], n[a]];
  let hits = findMatches(n),
    points = 0,
    chains = 0;
  if (!hits.length) return { board, points: 0, chains: 0 };
  while (hits.length && chains < 40) {
    chains++;
    points += hits.length * 25 * chains;
    for (const i of hits) n[i] = -1;
    for (let x = 0; x < 8; x++) {
      const col = [];
      for (let y = 7; y >= 0; y--)
        if (n[y * 8 + x] >= 0) col.push(n[y * 8 + x]);
      for (let y = 7; y >= 0; y--)
        n[y * 8 + x] = col[7 - y] ?? Math.floor(random() * 6);
    }
    hits = findMatches(n);
  }
  if (hits.length || !hasGemMove(n)) n = newGems(random);
  return { board: n, points, chains };
}
const size = 9;
export function newDungeon(floor = 1, previous = null, random = Math.random) {
  const walls = Array.from(
    { length: 81 },
    (_, i) =>
      (i % 9) % 2 === 0 && Math.floor(i / 9) % 2 === 0 && i !== 0 && i !== 80,
  );
  const used = new Set([0, 80]);
  const pick = () => {
    for (let tries = 0; tries < 1000; tries++) {
      const i = Math.floor(random() * 81);
      if (i > 12 && !walls[i] && !used.has(i)) {
        used.add(i);
        return i;
      }
    }
    return -1;
  };
  const enemies = Array.from({ length: 4 + floor }, (_, id) => ({
    id,
    pos: pick(),
    hp: floor * 5 + 7,
    boss: floor === 5 && id === 0,
  }))
    .filter((e) => e.pos >= 0)
    .map((e) => ({ ...e, hp: e.boss ? 55 : e.hp }));
  return {
    floor,
    walls,
    enemies,
    loot: Array.from({ length: 4 }, () => pick()).filter((i) => i >= 0),
    pos: 0,
    hp: previous?.hp ?? 35,
    maxHp: previous?.maxHp ?? 35,
    potions: previous?.potions ?? 2,
    attack: previous?.attack ?? 7,
    score: previous?.score ?? 0,
    seen: [0, 1, 2, 9, 10, 11, 18, 19, 20],
    status: "playing",
    message: "Find the stairs. Defeat every guardian to unlock them.",
  };
}
export function dungeonStep(state, action) {
  if (state.status !== "playing") return state;
  let s = {
    ...state,
    enemies: state.enemies.map((e) => ({ ...e })),
    loot: [...state.loot],
  };
  if (action === "heal") {
    if (!s.potions || s.hp === s.maxHp) return state;
    s.potions--;
    s.hp = Math.min(s.maxHp, s.hp + 20);
    s.message = "Potion restores 20 health.";
  } else if (action === "wait") s.message = "You brace for the next attack.";
  else {
    const d = { up: -9, down: 9, left: -1, right: 1 }[action];
    const dest = s.pos + d;
    if (
      d === undefined ||
      dest < 0 ||
      dest >= 81 ||
      !adjacent(s.pos, dest, 9) ||
      s.walls[dest]
    )
      return state;
    const enemy = s.enemies.find((e) => e.pos === dest);
    if (enemy) {
      enemy.hp -= s.attack;
      s.message = "You strike for " + s.attack + " damage.";
      if (enemy.hp <= 0) {
        s.enemies = s.enemies.filter((e) => e !== enemy);
        s.score += enemy.boss ? 800 : 120;
        s.message = "Guardian defeated!";
      }
    } else {
      s.pos = dest;
      if (s.loot.includes(dest)) {
        s.loot = s.loot.filter((i) => i !== dest);
        s.potions++;
        s.score += 40;
        s.message = "You found a potion.";
      }
    }
  }
  const occupied = new Set(s.enemies.map((e) => e.pos));
  for (const e of s.enemies) {
    if (adjacent(e.pos, s.pos, 9)) {
      s.hp -= e.boss ? 6 : 2 + Math.floor(s.floor / 2);
      continue;
    }
    const q = [[s.pos]],
      visited = new Set([s.pos]);
    let path = null;
    while (q.length && !path) {
      const p = q.shift(),
        v = p[p.length - 1];
      for (const n of [v - 9, v + 9, v - 1, v + 1]) {
        if (
          n < 0 ||
          n >= 81 ||
          !adjacent(v, n, 9) ||
          s.walls[n] ||
          visited.has(n) ||
          (occupied.has(n) && n !== e.pos)
        )
          continue;
        const next = [...p, n];
        if (n === e.pos) {
          path = next;
          break;
        }
        visited.add(n);
        q.push(next);
      }
    }
    if (path?.length > 2) {
      occupied.delete(e.pos);
      e.pos = path[path.length - 2];
      occupied.add(e.pos);
    }
  }
  const seen = new Set(s.seen);
  for (let i = 0; i < 81; i++)
    if (
      Math.abs((i % 9) - (s.pos % 9)) <= 2 &&
      Math.abs(Math.floor(i / 9) - Math.floor(s.pos / 9)) <= 2
    )
      seen.add(i);
  s.seen = [...seen];
  if (s.hp <= 0) {
    s.hp = 0;
    s.status = "lost";
    s.message = "The dungeon wins this time.";
  } else if (s.pos === 80 && !s.enemies.length) {
    s.status = s.floor === 5 ? "won" : "upgrade";
    s.score += 500;
    s.message =
      s.status === "won"
        ? "The final guardian falls. Dungeon conquered!"
        : "Floor cleared! Choose an upgrade.";
  }
  return s;
}
