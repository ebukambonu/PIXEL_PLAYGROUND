import React, { useEffect, useRef, useState } from "react";
import {
  ROUTE,
  pathPosition,
  newDefense,
  startWave,
  buildTower,
  defenseTick,
  newGems,
  swapGems,
  newDungeon,
  dungeonStep,
} from "./advancedLogic.js";
import "./advancedGames.css";
export const ADVANCED_GAMES = [
  {
    id: "tower-defense",
    name: "Neon Citadel",
    category: "Strategy",
    description:
      "Build and upgrade a defense. Survive ten waves and three bosses.",
    color: "purple",
    icon: "citadel",
    tag: "NEW · STRATEGY",
  },
  {
    id: "dungeon-crawl",
    name: "Dungeon Depths",
    category: "Adventure",
    description:
      "Explore five floors, collect potions and choose your upgrades.",
    color: "green",
    icon: "dungeon",
    tag: "NEW · ADVENTURE",
  },
  {
    id: "starfighter",
    name: "Starfighter",
    category: "Arcade",
    description:
      "Dodge enemy fire, collect upgrades and defeat the mothership.",
    color: "blue",
    icon: "starfighter",
    tag: "NEW · ACTION",
  },
  {
    id: "gem-quest",
    name: "Gem Quest",
    category: "Puzzle",
    description: "Plan swaps, chain cascades and conquer six score challenges.",
    color: "pink",
    icon: "gems",
    tag: "NEW · CASCADES",
  },
];
function useFinalScore(status, score, onScore) {
  const done = useRef(false),
    callback = useRef(onScore);
  callback.current = onScore;
  useEffect(() => {
    if (status === "playing") done.current = false;
    if ((status === "won" || status === "lost") && !done.current) {
      done.current = true;
      callback.current(Math.floor(score));
    }
  }, [status, score]);
}
function useClock(active, step, ms) {
  const ref = useRef(step);
  ref.current = step;
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => {
      if (!document.hidden) ref.current();
    }, ms);
    return () => clearInterval(tick);
  }, [active, ms]);
}
function Controls({ move }) {
  return (
    <div className="quest-controls" aria-label="Movement controls">
      <button onClick={() => move("up")} aria-label="Move up">
        ▲
      </button>
      <div>
        <button onClick={() => move("left")} aria-label="Move left">
          ◀
        </button>
        <button onClick={() => move("down")} aria-label="Move down">
          ▼
        </button>
        <button onClick={() => move("right")} aria-label="Move right">
          ▶
        </button>
      </div>
    </div>
  );
}
function moveKey(event, move) {
  const action = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  }[event.key];
  if (action) {
    event.preventDefault();
    move(action);
  }
}
export function TowerDefense({ onScore }) {
  const [s, set] = useState(newDefense),
    [type, setType] = useState("pulse"),
    [selected, select] = useState(null),
    [paused, pause] = useState(false);
  useFinalScore(s.status, s.score, onScore);
  useClock(s.active && !paused, () => set((old) => defenseTick(old, 0.1)), 100);
  const tower = s.towers.find(
    (t) => t.x === selected?.x && t.y === selected?.y,
  );
  const cost = tower ? tower.level * 65 : type === "frost" ? 80 : 60;
  return (
    <div className="quest-game">
      <div className="quest-stats">
        <span>❤️ {s.lives}</span>
        <span>🪙 {s.gold}</span>
        <span>Wave {s.wave}/10</span>
        <span>{s.score} pts</span>
      </div>
      <div className="quest-toolbar">
        <button
          aria-pressed={type === "pulse"}
          onClick={() => setType("pulse")}
        >
          ⚡ Pulse · 60
        </button>
        <button
          aria-pressed={type === "frost"}
          onClick={() => setType("frost")}
        >
          ❄ Frost · 80
        </button>
        <button onClick={() => pause(!paused)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => {
            set(newDefense());
            select(null);
            pause(false);
          }}
        >
          Restart
        </button>
      </div>
      <svg
        className="quest-defense"
        viewBox="0 0 500 300"
        aria-label="Defense map. Select a grass tile to build a tower."
      >
        {Array.from({ length: 60 }, (_, i) => {
          const x = i % 10,
            y = Math.floor(i / 10),
            path = ROUTE.some((p) => p[0] === x && p[1] === y);
          return (
            <rect
              key={i}
              x={x * 50 + 1}
              y={y * 50 + 1}
              width="48"
              height="48"
              rx="6"
              fill={
                path
                  ? "#39405b"
                  : selected?.x === x && selected?.y === y
                    ? "#486546"
                    : "#1e3436"
              }
              role={path ? undefined : "button"}
              tabIndex={path ? undefined : 0}
              aria-label={`Build tile ${x + 1}, ${y + 1}`}
              onClick={() => !path && select({ x, y })}
              onKeyDown={(e) => {
                if (!path && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  select({ x, y });
                }
              }}
            />
          );
        })}
        {s.towers.map((t) => (
          <g key={`${t.x},${t.y}`} pointerEvents="none">
            <circle
              cx={t.x * 50 + 25}
              cy={t.y * 50 + 25}
              r={12 + t.level * 2}
              fill={t.type === "frost" ? "#7edcf6" : "#ceb1ff"}
            />
            <text
              x={t.x * 50 + 25}
              y={t.y * 50 + 30}
              textAnchor="middle"
              fill="#17202d"
              fontSize="14"
              fontWeight="bold"
            >
              {t.level}
            </text>
          </g>
        ))}
        {s.enemies.map((e) => {
          const p = pathPosition(e.p);
          return (
            <g key={e.id} pointerEvents="none">
              <circle
                cx={p.x * 50 + 25}
                cy={p.y * 50 + 25}
                r={e.boss ? 15 : 10}
                fill={e.slow > 0 ? "#88dcff" : e.boss ? "#ffad66" : "#f27091"}
              />
              <rect
                x={p.x * 50 + 10}
                y={p.y * 50 + 7}
                width={(30 * e.hp) / e.max}
                height="3"
                fill="#b9ff97"
              />
            </g>
          );
        })}
        {s.shots.map((p, i) => (
          <line
            key={i}
            x1={p.x * 50 + 25}
            y1={p.y * 50 + 25}
            x2={p.to.x * 50 + 25}
            y2={p.to.y * 50 + 25}
            stroke={p.type === "frost" ? "#9deaff" : "#f9e5ff"}
            strokeWidth="3"
            pointerEvents="none"
          />
        ))}
        <text x="9" y="146" fontSize="9" fill="white" pointerEvents="none">
          IN
        </text>
        <text x="458" y="80" fontSize="10" fill="white" pointerEvents="none">
          BASE
        </text>
      </svg>
      <div className="quest-toolbar">
        <button
          disabled={
            !selected ||
            s.gold < cost ||
            tower?.level === 3 ||
            s.status !== "playing"
          }
          onClick={() =>
            set((old) => buildTower(old, selected.x, selected.y, type))
          }
        >
          {tower
            ? tower.level === 3
              ? "Max level"
              : `Upgrade tower · ${cost}`
            : `Build ${type} · ${cost}`}
        </button>
        <button
          disabled={s.active || s.status !== "playing" || paused}
          onClick={() => set(startWave)}
        >
          Start wave {Math.min(10, s.wave + 1)}
        </button>
      </div>
      <p className="quest-message" role="status">
        {s.status === "won"
          ? "Victory! All ten waves defeated."
          : s.status === "lost"
            ? "The citadel fell. Try a new tower layout."
            : paused
              ? "Paused."
              : s.active
                ? "Defend the base! You can build and upgrade during a wave."
                : "Select a grass tile, build towers, then launch the next wave."}
      </p>
      <p className="quest-help">
        Pulse deals heavy damage. Frost slows enemies so nearby towers can
        finish them. Upgrade to level 3. Bosses arrive every third wave. Pause
        before planning.
      </p>
    </div>
  );
}
export function DungeonCrawl({ onScore }) {
  const [s, set] = useState(() => newDungeon()),
    [paused, pause] = useState(false);
  useFinalScore(s.status, s.score, onScore);
  const move = (action) => {
    if (!paused) set((old) => dungeonStep(old, action));
  };
  const upgrade = (kind) =>
    set((old) =>
      newDungeon(old.floor + 1, {
        ...old,
        hp:
          kind === "vitality"
            ? old.maxHp + 10
            : Math.min(old.maxHp, old.hp + 15),
        maxHp: old.maxHp + (kind === "vitality" ? 10 : 0),
        attack: old.attack + (kind === "blade" ? 4 : 0),
        potions: old.potions + (kind === "supply" ? 3 : 0),
      }),
    );
  return (
    <div
      className="quest-game"
      tabIndex="0"
      onKeyDown={(e) => moveKey(e, move)}
      aria-label="Dungeon controls. Arrow keys or WASD move and attack."
    >
      <div className="quest-stats">
        <span>Floor {s.floor}/5</span>
        <span>
          ❤️ {s.hp}/{s.maxHp}
        </span>
        <span>⚔ {s.attack}</span>
        <span>{s.score} pts</span>
      </div>
      <div className="quest-toolbar">
        <button
          disabled={!s.potions || s.status !== "playing" || paused}
          onClick={() => move("heal")}
        >
          🧪 Heal ({s.potions})
        </button>
        <button
          disabled={s.status !== "playing" || paused}
          onClick={() => move("wait")}
        >
          Wait
        </button>
        <button onClick={() => pause(!paused)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => {
            set(newDungeon());
            pause(false);
          }}
        >
          New run
        </button>
      </div>
      <div className="quest-dungeon" aria-label="Dungeon map">
        {Array.from({ length: 81 }, (_, i) => {
          const visible = s.seen.includes(i),
            enemy = s.enemies.find((e) => e.pos === i),
            you = s.pos === i;
          const label = !visible
            ? "Unexplored"
            : you
              ? "You"
              : s.walls[i]
                ? "Wall"
                : enemy
                  ? `${enemy.boss ? "Boss" : "Guardian"} ${enemy.hp} health`
                  : i === 80
                    ? "Stairs"
                    : s.loot.includes(i)
                      ? "Potion"
                      : "Floor";
          return (
            <button
              key={i}
              tabIndex="-1"
              className={
                !visible ? "fog" : s.walls[i] ? "wall" : you ? "hero" : ""
              }
              aria-label={label}
              onClick={() => {
                const diff = i - s.pos;
                const a = { 1: "right", "-1": "left", 9: "down", "-9": "up" }[
                  diff
                ];
                if (a) move(a);
              }}
            >
              {!visible
                ? ""
                : you
                  ? "🧙"
                  : s.walls[i]
                    ? ""
                    : enemy
                      ? enemy.boss
                        ? "👹"
                        : "👻"
                      : i === 80
                        ? s.enemies.length
                          ? "🔒"
                          : "🪜"
                        : s.loot.includes(i)
                          ? "🧪"
                          : "·"}
            </button>
          );
        })}
      </div>
      <p className="quest-message" role="status">
        {paused ? "Paused." : s.message}
      </p>
      {s.status === "upgrade" && (
        <div className="quest-upgrades">
          <strong>Choose one reward and descend</strong>
          <button onClick={() => upgrade("blade")}>
            Forged blade · +4 attack
          </button>
          <button onClick={() => upgrade("vitality")}>
            Vitality · +10 maximum HP, full heal
          </button>
          <button onClick={() => upgrade("supply")}>
            Supplies · +3 potions, heal 15
          </button>
        </div>
      )}
      <Controls move={move} />
      <p className="quest-help">
        Tap a neighbouring tile or use arrows/WASD. Walk into a guardian to
        attack. Each action gives enemies a turn. Defeat all guardians, then
        reach 🪜 in the bottom right. Potions heal 20 HP; healing takes a turn.
      </p>
    </div>
  );
}
const GEMS = ["💎", "🔮", "🍀", "🔥", "⭐", "🌊"];
export function GemQuest({ onScore }) {
  const fresh = () => ({
    board: newGems(),
    score: 0,
    moves: 22,
    stage: 1,
    status: "playing",
    message: "Swap adjacent gems to match three or more.",
  });
  const [s, set] = useState(fresh),
    [selected, select] = useState(null);
  useFinalScore(s.status, s.score, onScore);
  const choose = (i) => {
    if (s.status !== "playing") return;
    if (selected === null) {
      select(i);
      return;
    }
    const result = swapGems(s.board, selected, i);
    if (!result.points) {
      select(i);
      set((old) => ({
        ...old,
        message: "That swap makes no match. Try another pair.",
      }));
      return;
    }
    select(null);
    set((old) => {
      const score = old.score + result.points,
        moves = old.moves - 1,
        goal = old.stage * 1800;
      return {
        ...old,
        ...result,
        score,
        moves,
        status:
          score >= goal
            ? old.stage === 6
              ? "won"
              : "upgrade"
            : moves === 0
              ? "lost"
              : "playing",
        message:
          result.chains > 1
            ? `${result.chains} cascades! +${result.points} points`
            : `+${result.points} points`,
      };
    });
  };
  return (
    <div className="quest-game">
      <div className="quest-stats">
        <span>Stage {s.stage}/6</span>
        <span>{s.moves} moves</span>
        <span>
          {s.score} / {s.stage * 1800} pts
        </span>
      </div>
      <progress
        className="quest-progress"
        value={Math.min(s.score, s.stage * 1800)}
        max={s.stage * 1800}
        aria-label="Stage score progress"
      />
      <div className="quest-gems">
        {s.board.map((v, i) => (
          <button
            key={i}
            disabled={s.status !== "playing"}
            aria-label={`${GEMS[v]} row ${Math.floor(i / 8) + 1} column ${(i % 8) + 1}`}
            aria-pressed={selected === i}
            className={"gem gem-" + v}
            onClick={() => choose(i)}
          >
            {GEMS[v]}
          </button>
        ))}
      </div>
      <p className="quest-message" role="status">
        {s.status === "lost"
          ? "Out of moves! Try again and look for chain reactions."
          : s.status === "won"
            ? "All six stages complete. Gem master!"
            : s.message}
      </p>
      <div className="quest-toolbar">
        {s.status === "upgrade" && (
          <button
            onClick={() => {
              set((old) => ({
                ...old,
                stage: old.stage + 1,
                moves: old.moves + 16,
                board: newGems(),
                status: "playing",
                message: "Next stage! Unused moves carry over.",
              }));
              select(null);
            }}
          >
            Next stage · +16 moves
          </button>
        )}
        <button
          onClick={() => {
            set(fresh());
            select(null);
          }}
        >
          New quest
        </button>
      </div>
      <p className="quest-help">
        Select two neighbouring gems. Matches clear automatically; falling gems
        can create cascades with increasing multipliers. Invalid swaps cost no
        moves. Reach each target to gain 16 more moves. Deadlocked boards
        reshuffle automatically.
      </p>
    </div>
  );
}
function newFlight() {
  return {
    x: 250,
    y: 390,
    hp: 5,
    score: 0,
    time: 0,
    wave: 1,
    shots: [],
    enemies: [],
    bolts: [],
    drops: [],
    power: 1,
    spawn: 0,
    fire: 0,
    boss: false,
    bossDown: false,
    invincible: 0,
    status: "ready",
    id: 0,
  };
}
export function Starfighter({ onScore }) {
  const [s, set] = useState(newFlight),
    [paused, pause] = useState(false),
    keys = useRef(new Set()),
    arena = useRef(null),
    target = useRef(null);
  useFinalScore(s.status, s.score, onScore);
  useEffect(() => {
    const clear = () => {
      keys.current.clear();
      target.current = null;
    };
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);
  useClock(
    s.status === "playing" && !paused,
    () =>
      set((old) => {
        const n = {
            ...old,
            shots: old.shots.map((p) => ({ ...p })),
            bolts: old.bolts.map((p) => ({ ...p })),
            enemies: old.enemies.map((p) => ({ ...p })),
            drops: old.drops.map((p) => ({ ...p })),
          },
          dt = 0.04;
        n.time += dt;
        n.wave = Math.min(6, 1 + Math.floor(n.time / 14));
        n.invincible = Math.max(0, n.invincible - dt);
        const k = keys.current;
        let dx =
            (k.has("ArrowRight") || k.has("d") ? 1 : 0) -
            (k.has("ArrowLeft") || k.has("a") ? 1 : 0),
          dy =
            (k.has("ArrowDown") || k.has("s") ? 1 : 0) -
            (k.has("ArrowUp") || k.has("w") ? 1 : 0);
        if (target.current) {
          dx = Math.max(-1, Math.min(1, (target.current.x - n.x) / 9));
          dy = Math.max(-1, Math.min(1, (target.current.y - n.y) / 9));
        }
        const length = Math.max(1, Math.hypot(dx, dy));
        n.x = Math.max(16, Math.min(484, n.x + (dx / length) * 7));
        n.y = Math.max(25, Math.min(432, n.y + (dy / length) * 7));
        n.fire -= dt;
        if (n.fire <= 0) {
          for (let i = 0; i < n.power; i++)
            n.shots.push({
              id: n.id++,
              x: n.x + (i - (n.power - 1) / 2) * 12,
              y: n.y - 16,
            });
          n.fire = 0.18;
        }
        n.spawn -= dt;
        if (n.time >= 70 && !n.boss) {
          n.boss = true;
          n.enemies.push({
            id: n.id++,
            x: 250,
            y: 55,
            hp: 140,
            max: 140,
            boss: true,
            fire: 1,
            phase: 0,
          });
        }
        if (!n.boss && n.spawn <= 0) {
          n.enemies.push({
            id: n.id++,
            x: 25 + Math.random() * 450,
            y: -20,
            hp: n.wave >= 4 ? 3 : 2,
            max: n.wave >= 4 ? 3 : 2,
            fire: 0.8 + Math.random(),
            phase: Math.random() * 6,
          });
          n.spawn = Math.max(0.32, 1.2 - n.wave * 0.13);
        }
        for (const e of n.enemies) {
          e.phase += dt;
          e.y += e.boss ? 0 : dt * (32 + n.wave * 7);
          e.x = Math.max(
            18,
            Math.min(
              482,
              e.x + Math.sin(e.phase * 2) * dt * (e.boss ? 80 : 25),
            ),
          );
          e.fire -= dt;
          if (e.fire <= 0) {
            const angles = e.boss ? [-0.6, -0.3, 0, 0.3, 0.6] : [0];
            for (const angle of angles)
              n.bolts.push({
                id: n.id++,
                x: e.x,
                y: e.y + 15,
                vx: Math.sin(angle) * 135,
                vy: 120 + n.wave * 9,
              });
            e.fire = e.boss ? 0.65 : 2.3;
          }
        }
        for (const p of n.shots) p.y -= dt * 420;
        for (const p of n.bolts) {
          p.y += p.vy * dt;
          p.x += p.vx * dt;
        }
        for (const p of n.drops) p.y += dt * 55;
        for (const p of n.shots) {
          const enemy = n.enemies.find(
            (e) =>
              e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < (e.boss ? 42 : 20),
          );
          if (enemy) {
            enemy.hp--;
            p.y = -100;
          }
        }
        n.enemies = n.enemies.filter((e) => {
          if (e.hp <= 0) {
            n.score += e.boss ? 3000 : 100;
            if (e.boss) n.bossDown = true;
            else if (Math.random() < 0.28)
              n.drops.push({
                id: n.id++,
                x: e.x,
                y: e.y,
                type: Math.random() < 0.35 ? "heal" : "power",
              });
            return false;
          }
          return e.y < 480;
        });
        if (
          n.invincible === 0 &&
          (n.bolts.some((p) => Math.hypot(p.x - n.x, p.y - n.y) < 16) ||
            n.enemies.some(
              (e) => Math.hypot(e.x - n.x, e.y - n.y) < (e.boss ? 48 : 28),
            ))
        ) {
          n.hp--;
          n.invincible = 1.5;
          n.power = Math.max(1, n.power - 1);
        }
        n.drops = n.drops.filter((p) => {
          if (Math.hypot(p.x - n.x, p.y - n.y) < 25) {
            if (p.type === "heal") n.hp = Math.min(5, n.hp + 1);
            else n.power = Math.min(3, n.power + 1);
            n.score += 40;
            return false;
          }
          return p.y < 470;
        });
        n.shots = n.shots.filter((p) => p.y > -10);
        n.bolts = n.bolts.filter((p) => p.y < 480 && p.x > -10 && p.x < 510);
        if (n.hp <= 0) n.status = "lost";
        else if (n.bossDown) n.status = "won";
        return n;
      }),
    40,
  );
  const point = (e) => {
    const r = arena.current.getBoundingClientRect();
    target.current = {
      x: ((e.clientX - r.left) * 500) / r.width,
      y: ((e.clientY - r.top) * 450) / r.height,
    };
  };
  return (
    <div className="quest-game">
      <div className="quest-stats">
        <span>❤️ {s.hp}/5</span>
        <span>Wave {s.wave}/6</span>
        <span>Weapon {s.power}/3</span>
        <span>{s.score} pts</span>
      </div>
      <div className="quest-toolbar">
        <button
          onClick={() => {
            if (s.status === "ready") {
              set((old) => ({ ...old, status: "playing" }));
              arena.current?.focus();
            } else pause(!paused);
          }}
          disabled={s.status === "lost" || s.status === "won"}
        >
          {s.status === "ready" ? "Launch" : paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => {
            set(newFlight());
            pause(false);
            keys.current.clear();
            target.current = null;
          }}
        >
          Restart
        </button>
      </div>
      <svg
        ref={arena}
        className="quest-flight"
        viewBox="0 0 500 450"
        tabIndex="0"
        role="application"
        aria-label="Starfighter arena. Arrow keys or WASD to move. Drag on touchscreens. Firing is automatic."
        onKeyDown={(e) => {
          if (
            [
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
              "w",
              "a",
              "s",
              "d",
            ].includes(e.key)
          ) {
            e.preventDefault();
            keys.current.add(e.key);
          }
        }}
        onKeyUp={(e) => keys.current.delete(e.key)}
        onBlur={() => keys.current.clear()}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          point(e);
          arena.current.focus();
        }}
        onPointerMove={(e) => {
          if (e.buttons) point(e);
        }}
        onPointerUp={() => (target.current = null)}
        onPointerCancel={() => (target.current = null)}
      >
        <rect width="500" height="450" fill="#0b1124" />
        {Array.from({ length: 35 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 79) % 500}
            cy={(i * 131 + s.time * (15 + (i % 10))) % 450}
            r={i % 3 === 0 ? 1.7 : 1}
            fill="#a9c8e8"
            opacity=".6"
          />
        ))}
        {s.shots.map((p) => (
          <rect
            key={p.id}
            x={p.x - 2}
            y={p.y}
            width="4"
            height="12"
            rx="2"
            fill="#b7ff99"
          />
        ))}
        {s.bolts.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r="5" fill="#ff8ea3" />
        ))}
        {s.enemies.map((e) => (
          <g key={e.id}>
            <path
              d={
                e.boss
                  ? "M-42,-20 L42,-20 L32,20 L0,32 L-32,20 Z"
                  : "M-16,-10 L16,-10 L10,10 L0,18 L-10,10 Z"
              }
              transform={`translate(${e.x} ${e.y})`}
              fill={e.boss ? "#bc91ff" : "#ee8a91"}
            />
            <rect
              x={e.x - (e.boss ? 40 : 15)}
              y={e.y - 30}
              width={((e.boss ? 80 : 30) * e.hp) / e.max}
              height="4"
              fill="#d4fc89"
            />
          </g>
        ))}
        {s.drops.map((p) => (
          <text key={p.id} x={p.x} y={p.y} textAnchor="middle" fontSize="20">
            {p.type === "heal" ? "💚" : "⚡"}
          </text>
        ))}
        <path
          d="M0,-19 L16,15 L0,8 L-16,15 Z"
          transform={`translate(${s.x} ${s.y})`}
          fill={s.invincible > 0 ? "#ffffff" : "#89e4ff"}
          opacity={s.invincible > 0 ? 0.55 : 1}
        />
        {(s.status !== "playing" || paused) && (
          <g>
            <rect
              x="40"
              y="180"
              width="420"
              height="90"
              rx="16"
              fill="#19213a"
              opacity=".96"
            />
            <text
              x="250"
              y="220"
              fill="white"
              textAnchor="middle"
              fontSize="22"
            >
              {s.status === "won"
                ? "Mothership defeated!"
                : s.status === "lost"
                  ? "Mission over"
                  : paused
                    ? "Paused"
                    : "Ready, pilot?"}
            </text>
            <text
              x="250"
              y="246"
              fill="#bdcce2"
              textAnchor="middle"
              fontSize="13"
            >
              {s.status === "ready"
                ? "Press Launch. Your ship fires automatically."
                : `${s.score} points`}
            </text>
          </g>
        )}
      </svg>
      <p className="quest-help">
        Move with arrows/WASD, or drag inside the arena on your phone. Dodge
        pink shots. Collect ⚡ to upgrade your weapon and 💚 to repair. Survive
        70 seconds to face the mothership. Automatic fire keeps your hands free
        to dodge.
      </p>
    </div>
  );
}
