import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCcw,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  Check,
  Delete,
} from "lucide-react";
import {
  VALID_GUESSES,
  dailyWord,
  wordColors,
  slide2048,
  has2048Moves,
  winner,
  connectWinner,
} from "./gameLogic";
import { Hangman, FifteenPuzzle } from "./classics";
export const GAME_CATALOG = [
  {
    id: "hangman",
    name: "Hangman",
    category: "Word",
    description: "Find the hidden word before six wrong guesses.",
    color: "green",
    icon: "hangman",
    tag: "CLASSIC",
  },
  {
    id: "fifteen-puzzle",
    name: "15 Puzzle",
    category: "Puzzle",
    description: "Slide the tiles. Put every number in its place.",
    color: "orange",
    icon: "fifteen",
    tag: "CLASSIC",
  },
  {
    id: "wordle",
    name: "Daily Wordle",
    category: "Word",
    description: "Five letters. Six guesses. One daily ritual.",
    color: "green",
    icon: "wordle",
    tag: "DAILY CHALLENGE",
    players: "A fresh puzzle every day",
  },
  {
    id: "tetris",
    name: "Tetris",
    category: "Arcade",
    description: "Find your flow. Clear those lines.",
    color: "purple",
    icon: "tetris",
    tag: "FAN FAVORITE",
    players: "The timeless block classic",
  },
  {
    id: "snake",
    name: "Snake",
    category: "Arcade",
    description: "One more bite. One more high score.",
    color: "lime",
    icon: "snake",
    tag: "CLASSIC",
    players: "A little nostalgia, a lot of fun",
  },
  {
    id: "2048",
    name: "2048",
    category: "Puzzle",
    description: "Slide, combine, and chase the magic number.",
    color: "orange",
    icon: "2048",
    tag: "BRAIN BOOST",
    players: "Easy to play. Hard to put down.",
  },
  {
    id: "minesweeper",
    name: "Minesweeper",
    category: "Puzzle",
    description: "Trust your instincts. Watch your step.",
    color: "blue",
    icon: "mine",
    tag: "CLASSIC",
  },
  {
    id: "memory",
    name: "Memory Match",
    category: "Puzzle",
    description: "A perfect pair is just a flip away.",
    color: "pink",
    icon: "memory",
    tag: "QUICK PLAY",
  },
  {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    category: "Strategy",
    description: "Three in a row. You know what to do.",
    color: "purple",
    icon: "ttt",
    tag: "VS COMPUTER",
  },
  {
    id: "connect-four",
    name: "Connect Four",
    category: "Strategy",
    description: "Outthink your opponent, one disc at a time.",
    color: "orange",
    icon: "connect",
    tag: "2 PLAYERS",
  },
  {
    id: "pong",
    name: "Pong",
    category: "Arcade",
    description: "Keep it bouncing. Beat the computer.",
    color: "blue",
    icon: "pong",
    tag: "RETRO",
  },
  {
    id: "breakout",
    name: "Breakout",
    category: "Arcade",
    description: "Break every brick. Catch every bounce.",
    color: "pink",
    icon: "breakout",
    tag: "RETRO",
  },
  {
    id: "reaction",
    name: "Reaction Time",
    category: "Quick play",
    description: "How quick are you? Wait for the green.",
    color: "green",
    icon: "reaction",
    tag: "QUICK PLAY",
  },
  {
    id: "quiz",
    name: "Trivia Quest",
    category: "Quick play",
    description: "Big questions for curious minds.",
    color: "blue",
    icon: "quiz",
    tag: "10 QUESTIONS",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    category: "Puzzle",
    description: "Nine numbers. A world of possibilities.",
    color: "orange",
    icon: "sudoku",
    tag: "BRAIN BOOST",
  },
];
function useKeys(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const f = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "Backspace",
        ].includes(e.key)
      )
        e.preventDefault();
      ref.current(e.key);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
}
function Controls({ score, children, onReset }) {
  return (
    <div className="game-controls">
      <div className="game-score">
        <span>SCORE</span>
        <strong>{score}</strong>
      </div>
      {children}
      <button className="btn secondary" onClick={onReset}>
        <RotateCcw size={15} />
        New game
      </button>
    </div>
  );
}
function Dpad({ onMove }) {
  return (
    <div className="dpad">
      <button onClick={() => onMove("ArrowLeft")} aria-label="Move left">
        <ArrowLeft />
      </button>
      <div>
        <button onClick={() => onMove("ArrowUp")} aria-label="Move up">
          <ArrowUp />
        </button>
        <button onClick={() => onMove("ArrowDown")} aria-label="Move down">
          <ArrowDown />
        </button>
      </div>
      <button onClick={() => onMove("ArrowRight")} aria-label="Move right">
        <ArrowRight />
      </button>
    </div>
  );
}
function Wordle({ onScore }) {
  const date = new Date().toISOString().slice(0, 10),
    answer = dailyWord();
  const [guesses, setGuesses] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("pixel-wordle-" + date)) || [];
      } catch {
        return [];
      }
    }),
    [input, setInput] = useState(""),
    [message, setMessage] = useState("");
  const over = guesses.includes(answer) || guesses.length === 6;
  function key(k) {
    if (over) return;
    if (k === "Enter") {
      if (input.length !== 5) {
        setMessage("Fill all five letters first.");
        return;
      }
      if (!VALID_GUESSES.has(input)) {
        setMessage("Try a word in the dictionary.");
        return;
      }
      const next = [...guesses, input];
      setGuesses(next);
      setInput("");
      localStorage.setItem("pixel-wordle-" + date, JSON.stringify(next));
      if (input === answer) {
        setMessage("Beautifully done! Come back tomorrow.");
        onScore((7 - next.length) * 100);
      } else if (next.length === 6)
        setMessage("The word was " + answer + ". Tomorrow is a fresh start.");
      else setMessage("");
    } else if (k === "Backspace") setInput((s) => s.slice(0, -1));
    else if (/^[a-zA-Z]$/.test(k) && input.length < 5)
      setInput((s) => s + k.toUpperCase());
  }
  useKeys(key);
  const statuses = {};
  guesses.forEach((g) =>
    wordColors(g, answer).forEach((s, i) => {
      if (
        !statuses[g[i]] ||
        s === "correct" ||
        (s === "present" && statuses[g[i]] === "absent")
      )
        statuses[g[i]] = s;
    }),
  );
  return (
    <div className="wordle-game">
      <p className="game-instruction">
        Guess the daily 5-letter word in 6 tries. Resets at midnight UTC.
      </p>
      <div className="wordle-board">
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => {
            const g = guesses[r],
              status = g ? wordColors(g, answer)[c] : "";
            return (
              <div
                key={r + "-" + c}
                className={
                  "letter-cell " +
                  status +
                  (r === guesses.length && input[c] ? " filled" : "")
                }
              >
                {g?.[c] || (r === guesses.length ? input[c] : "")}
              </div>
            );
          }),
        )}
      </div>
      <p className="game-message">
        {message ||
          (over
            ? guesses.includes(answer)
              ? "You solved today’s puzzle!"
              : "Today’s word: " + answer
            : "Type a word or use the keyboard below.")}
      </p>
      <div className="word-keyboard">
        {["QWERTYUIOP", "ASDFGHJKL", "↵ZXCVBNM⌫"].map((row) => (
          <div key={row}>
            {[...row].map((k) => (
              <button
                key={k}
                className={statuses[k] || ""}
                aria-label={k === "↵" ? "Enter" : k === "⌫" ? "Backspace" : k}
                onClick={() =>
                  key(k === "↵" ? "Enter" : k === "⌫" ? "Backspace" : k)
                }
              >
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];
const TCOLORS = [
  "#6bdde5",
  "#fbd167",
  "#b995ff",
  "#bafa72",
  "#f18ca5",
  "#7aafff",
  "#f8aa72",
];
const newPiece = () => {
  const i = Math.floor(Math.random() * 7);
  return { shape: SHAPES[i].map((r) => [...r]), x: 3, y: 0, color: i + 1 };
};
function Tetris({ onScore }) {
  const [state, setState] = useState(() => ({
    board: Array.from({ length: 20 }, () => Array(10).fill(0)),
    piece: newPiece(),
    score: 0,
    lines: 0,
    over: false,
    paused: false,
  }));
  const reported = useRef(false);
  const collision = (b, p) =>
    p.shape.some((r, y) =>
      r.some(
        (v, x) =>
          v &&
          (p.x + x < 0 ||
            p.x + x >= 10 ||
            p.y + y >= 20 ||
            (p.y + y >= 0 && b[p.y + y][p.x + x])),
      ),
    );
  const action = useCallback(
    (k) =>
      setState((s) => {
        if (s.over) return s;
        if (k === "p" || k === "P") return { ...s, paused: !s.paused };
        if (s.paused) return s;
        let p = { ...s.piece };
        if (k === "ArrowLeft") p.x--;
        else if (k === "ArrowRight") p.x++;
        else if (k === "ArrowUp") {
          p.shape = p.shape[0].map((_, i) =>
            p.shape.map((r) => r[i]).reverse(),
          );
          if (collision(s.board, p)) {
            p.x--;
            if (collision(s.board, p)) {
              p.x += 2;
              if (collision(s.board, p)) return s;
            }
          }
        } else if (k === "ArrowDown") p.y++;
        else if (k === " ") {
          while (!collision(s.board, { ...p, y: p.y + 1 })) p.y++;
        } else return s;
        if (!collision(s.board, p) && k !== " ") return { ...s, piece: p };
        if (k === "ArrowDown" || k === " ") {
          const landed = k === " " ? p : s.piece;
          let board = s.board.map((r) => [...r]);
          landed.shape.forEach((r, y) =>
            r.forEach((v, x) => {
              if (v && landed.y + y >= 0)
                board[landed.y + y][landed.x + x] = landed.color;
            }),
          );
          const left = board.filter((r) => !r.every(Boolean)),
            cleared = 20 - left.length;
          while (left.length < 20) left.unshift(Array(10).fill(0));
          const piece = newPiece();
          return {
            ...s,
            board: left,
            piece,
            score:
              s.score + [0, 100, 300, 500, 800][cleared] + (k === " " ? 2 : 0),
            lines: s.lines + cleared,
            over: collision(left, piece),
          };
        }
        return s;
      }),
    [],
  );
  useKeys(action);
  useEffect(() => {
    if (state.paused || state.over) return;
    const t = setInterval(
      () => action("ArrowDown"),
      Math.max(140, 650 - Math.floor(state.lines / 5) * 70),
    );
    return () => clearInterval(t);
  }, [action, state.paused, state.over, state.lines]);
  useEffect(() => {
    if (state.over && !reported.current) {
      reported.current = true;
      onScore(state.score);
    }
  }, [state.over]);
  const cells = state.board.map((r) => [...r]);
  if (!state.over)
    state.piece.shape.forEach((r, y) =>
      r.forEach((v, x) => {
        if (v && cells[y + state.piece.y])
          cells[y + state.piece.y][x + state.piece.x] = state.piece.color;
      }),
    );
  return (
    <div>
      <Controls
        score={state.score}
        onReset={() => {
          reported.current = false;
          setState({
            board: Array.from({ length: 20 }, () => Array(10).fill(0)),
            piece: newPiece(),
            score: 0,
            lines: 0,
            over: false,
            paused: false,
          });
        }}
      >
        <button className="btn secondary" onClick={() => action("p")}>
          {state.paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </Controls>
      <div className="tetris-wrap">
        <div className="tetris-board">
          {cells.flat().map((v, i) => (
            <div
              key={i}
              style={{ background: v ? TCOLORS[v - 1] : undefined }}
            />
          ))}
          {(state.over || state.paused) && (
            <div className="board-overlay">
              {state.over ? "Game over" : "Paused"}
            </div>
          )}
        </div>
        <div className="tetris-info">
          <span>LINES</span>
          <h2>{state.lines}</h2>
          <p>
            ← → Move
            <br />↑ Rotate
            <br />↓ Soft drop
            <br />
            Space Hard drop
            <br />P Pause
          </p>
          <button className="btn primary" onClick={() => action(" ")}>
            Drop
          </button>
          <Dpad onMove={action} />
        </div>
      </div>
    </div>
  );
}
function Snake({ onScore }) {
  const fresh = () => ({
    snake: [
      [8, 10],
      [7, 10],
      [6, 10],
    ],
    food: [14, 10],
    dir: [1, 0],
    running: false,
    over: false,
    score: 0,
  });
  const [s, setS] = useState(fresh),
    dir = useRef([1, 0]);
  function key(k) {
    const next = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }[k];
    if (next) {
      setS((prev) => {
        if (next[0] !== -prev.dir[0] || next[1] !== -prev.dir[1])
          dir.current = next;
        return prev;
      });
    }
    if (k === " ") setS((prev) => ({ ...prev, running: !prev.running }));
  }
  useKeys(key);
  useEffect(() => {
    if (!s.running || s.over) return;
    const timer = setInterval(
      () =>
        setS((prev) => {
          const d = dir.current,
            h = [prev.snake[0][0] + d[0], prev.snake[0][1] + d[1]],
            eat = h[0] === prev.food[0] && h[1] === prev.food[1];
          if (
            h.some((v) => v < 0 || v >= 20) ||
            (eat ? prev.snake : prev.snake.slice(0, -1)).some(
              (p) => p[0] === h[0] && p[1] === h[1],
            )
          )
            return { ...prev, over: true, running: false };
          const snake = [h, ...prev.snake];
          if (!eat) snake.pop();
          if (snake.length === 400)
            return {
              ...prev,
              snake,
              score: prev.score + 10,
              over: true,
              running: false,
            };
          let food = prev.food;
          if (eat) {
            do {
              food = [
                Math.floor(Math.random() * 20),
                Math.floor(Math.random() * 20),
              ];
            } while (snake.some((p) => p[0] === food[0] && p[1] === food[1]));
          }
          return {
            ...prev,
            snake,
            food,
            dir: d,
            score: prev.score + (eat ? 10 : 0),
          };
        }),
      110,
    );
    return () => clearInterval(timer);
  }, [s.running, s.over]);
  useEffect(() => {
    if (s.over) onScore(s.score);
  }, [s.over]);
  return (
    <div>
      <Controls
        score={s.score}
        onReset={() => {
          dir.current = [1, 0];
          setS(fresh());
        }}
      >
        <button
          className="btn primary"
          disabled={s.over}
          onClick={() => setS((p) => ({ ...p, running: !p.running }))}
        >
          {s.running ? <Pause size={15} /> : <Play size={15} />}{" "}
          {s.running ? "Pause" : "Play"}
        </button>
      </Controls>
      <div className="snake-board">
        {Array.from({ length: 400 }, (_, i) => {
          const x = i % 20,
            y = Math.floor(i / 20),
            part = s.snake.findIndex((p) => p[0] === x && p[1] === y);
          return (
            <div
              key={i}
              className={
                part === 0
                  ? "snake-head"
                  : part > 0
                    ? "snake-body"
                    : s.food[0] === x && s.food[1] === y
                      ? "snake-food"
                      : ""
              }
            />
          );
        })}
        {s.over && (
          <div className="board-overlay">Game over · {s.score} points</div>
        )}
      </div>
      <p className="game-instruction">
        Arrow keys to move · Space to pause · Eat, grow, repeat.
      </p>
      <Dpad onMove={key} />
    </div>
  );
}
function addTile(board) {
  const empty = [];
  board.forEach((r, y) =>
    r.forEach((v, x) => {
      if (!v) empty.push([y, x]);
    }),
  );
  if (!empty.length) return board;
  const [y, x] = empty[Math.floor(Math.random() * empty.length)];
  const b = board.map((r) => [...r]);
  b[y][x] = Math.random() < 0.9 ? 2 : 4;
  return b;
}
function G2048({ onScore }) {
  const fresh = () => ({
    board: addTile(addTile(Array.from({ length: 4 }, () => Array(4).fill(0)))),
    score: 0,
    over: false,
  });
  const [s, setS] = useState(fresh);
  function key(k) {
    const direction = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    }[k];
    if (!direction || s.over) return;
    setS((prev) => {
      const result = slide2048(prev.board, direction);
      if (!result.changed) return prev;
      const board = addTile(result.board);
      return {
        board,
        score: prev.score + result.score,
        over: !has2048Moves(board),
      };
    });
  }
  useKeys(key);
  useEffect(() => {
    if (s.over) onScore(s.score);
  }, [s.over]);
  return (
    <div>
      <Controls score={s.score} onReset={() => setS(fresh())} />
      <div className="board-2048">
        {s.board.flat().map((v, i) => (
          <div key={i} className={"tile tile-" + v}>
            {v || ""}
          </div>
        ))}
        {s.over && (
          <div className="board-overlay">No more moves · {s.score} points</div>
        )}
      </div>
      {s.board.flat().includes(2048) && (
        <p className="game-message">
          You made 2048! Keep going for an even bigger tile.
        </p>
      )}
      <p className="game-instruction">
        Use the arrow keys to slide. Matching tiles combine.
      </p>
      <Dpad onMove={key} />
    </div>
  );
}
function Minesweeper({ onScore }) {
  const fresh = () => ({
    mines: [],
    opened: [],
    flags: [],
    over: false,
    won: false,
    started: false,
  });
  const [s, setS] = useState(fresh),
    [flagMode, setFlagMode] = useState(false);
  const neighbors = (i) => {
    const r = Math.floor(i / 9),
      c = i % 9;
    return Array.from({ length: 81 }, (_, j) => j).filter(
      (j) =>
        j !== i &&
        Math.abs(Math.floor(j / 9) - r) <= 1 &&
        Math.abs((j % 9) - c) <= 1,
    );
  };
  function reveal(i) {
    if (s.over || s.opened.includes(i)) return;
    if (flagMode) {
      flag(i);
      return;
    }
    if (s.flags.includes(i)) return;
    let mines = s.mines;
    if (!s.started) {
      const excluded = [i, ...neighbors(i)];
      const pool = Array.from({ length: 81 }, (_, j) => j).filter(
        (j) => !excluded.includes(j),
      );
      mines = [];
      while (mines.length < 10)
        mines.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    if (mines.includes(i)) {
      setS({
        ...s,
        mines,
        over: true,
        opened: [...s.opened, i],
        started: true,
      });
      return;
    }
    const opened = new Set(s.opened),
      queue = [i];
    while (queue.length) {
      const n = queue.pop();
      if (opened.has(n) || s.flags.includes(n)) continue;
      opened.add(n);
      if (!neighbors(n).some((j) => mines.includes(j)))
        queue.push(
          ...neighbors(n).filter((j) => !opened.has(j) && !mines.includes(j)),
        );
    }
    const won = opened.size === 71;
    setS({ ...s, mines, opened: [...opened], over: won, won, started: true });
    if (won) onScore(1000);
  }
  function flag(i) {
    if (s.over || s.opened.includes(i)) return;
    setS({
      ...s,
      flags: s.flags.includes(i)
        ? s.flags.filter((j) => j !== i)
        : [...s.flags, i],
    });
  }
  return (
    <div>
      <Controls score={s.opened.length} onReset={() => setS(fresh())}>
        <button
          className={"btn " + (flagMode ? "primary" : "secondary")}
          onClick={() => setFlagMode(!flagMode)}
        >
          <Flag size={15} />
          Flag mode
        </button>
      </Controls>
      <p className="game-instruction">
        10 mines · Click to reveal · Right-click to flag · First click is safe.
      </p>
      <div className="mine-board">
        {Array.from({ length: 81 }, (_, i) => {
          const open = s.opened.includes(i),
            mine = s.mines.includes(i),
            count = neighbors(i).filter((j) => s.mines.includes(j)).length;
          return (
            <button
              aria-label={"Cell " + (i + 1)}
              key={i}
              onClick={() => reveal(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                flag(i);
              }}
              className={open ? "revealed" : ""}
              style={{
                color: ["", "#87bbff", "#bafa72", "#ffaf7a", "#c7a3ff"][
                  Math.min(count, 4)
                ],
              }}
            >
              {s.over && mine
                ? "💣"
                : s.flags.includes(i)
                  ? "⚑"
                  : open
                    ? count || ""
                    : ""}
            </button>
          );
        })}
      </div>
      <p className="game-message">
        {s.over
          ? s.won
            ? "A perfectly clear field. You win!"
            : "Boom! New game, fresh start."
          : "Take your time. Every number is a clue."}
      </p>
    </div>
  );
}
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
function Memory({ onScore }) {
  const fresh = () => ({
    cards: shuffle(
      ["🍒", "👾", "🚀", "🌈", "🎮", "⚡", "🌙", "💎"].flatMap((x) => [x, x]),
    ),
    open: [],
    matched: [],
    moves: 0,
  });
  const [s, setS] = useState(fresh);
  useEffect(() => {
    if (s.open.length !== 2) return;
    const [a, b] = s.open;
    if (s.cards[a] === s.cards[b]) {
      setS((p) => ({ ...p, matched: [...p.matched, a, b], open: [] }));
    } else {
      const t = setTimeout(() => setS((p) => ({ ...p, open: [] })), 800);
      return () => clearTimeout(t);
    }
  }, [s.open]);
  useEffect(() => {
    if (s.matched.length === 16) onScore(Math.max(100, 1200 - s.moves * 30));
  }, [s.matched.length]);
  return (
    <div>
      <Controls score={s.moves + " moves"} onReset={() => setS(fresh())} />
      <div className="memory-board">
        {s.cards.map((card, i) => (
          <button
            key={i}
            aria-label={
              s.open.includes(i) || s.matched.includes(i)
                ? card
                : "Flip card " + (i + 1)
            }
            className={
              s.matched.includes(i)
                ? "matched"
                : s.open.includes(i)
                  ? "flipped"
                  : ""
            }
            onClick={() => {
              if (
                s.open.length === 2 ||
                s.open.includes(i) ||
                s.matched.includes(i)
              )
                return;
              setS({
                ...s,
                open: [...s.open, i],
                moves: s.moves + (s.open.length === 1 ? 1 : 0),
              });
            }}
          >
            {s.open.includes(i) || s.matched.includes(i) ? card : "✦"}
          </button>
        ))}
      </div>
      <p className="game-message">
        {s.matched.length === 16
          ? "Every pair, perfectly found!"
          : "Flip two cards and find matching pairs."}
      </p>
    </div>
  );
}
function TTT({ onScore }) {
  const [board, setBoard] = useState(Array(9).fill(null)),
    [mode, setMode] = useState("bot");
  const win = winner(board),
    turn = board.filter(Boolean).length % 2 === 0 ? "X" : "O";
  useEffect(() => {
    if (mode !== "bot" || turn !== "O" || win) return;
    const timer = setTimeout(() => {
      let choices = board
          .map((v, i) => (v ? null : i))
          .filter((v) => v !== null),
        choice;
      for (const mark of ["O", "X"]) {
        choice = choices.find((i) => {
          const b = [...board];
          b[i] = mark;
          return winner(b) === mark;
        });
        if (choice !== undefined) break;
      }
      if (choice === undefined)
        choice = choices.includes(4)
          ? 4
          : choices[Math.floor(Math.random() * choices.length)];
      setBoard((b) => {
        const next = [...b];
        next[choice] = "O";
        return next;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [board, mode]);
  useEffect(() => {
    if (win === "X") onScore(100);
  }, [win]);
  return (
    <div>
      <div className="game-controls">
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setBoard(Array(9).fill(null));
          }}
        >
          <option value="bot">Vs computer</option>
          <option value="friend">Two players</option>
        </select>
        <button
          className="btn secondary"
          onClick={() => setBoard(Array(9).fill(null))}
        >
          <RotateCcw size={15} />
          New game
        </button>
      </div>
      <div className="ttt-board">
        {board.map((v, i) => (
          <button
            key={i}
            aria-label={"Cell " + (i + 1)}
            className={"mark-" + v}
            onClick={() => {
              if (v || win || (mode === "bot" && turn === "O")) return;
              const b = [...board];
              b[i] = turn;
              setBoard(b);
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="game-message">
        {win
          ? win === "draw"
            ? "A worthy match. It’s a draw!"
            : win + " wins!"
          : turn + "’s turn"}
      </p>
    </div>
  );
}
function Connect({ onScore }) {
  const fresh = () => Array.from({ length: 6 }, () => Array(7).fill(null));
  const [board, setBoard] = useState(fresh);
  const turn =
      board.flat().filter(Boolean).length % 2 === 0 ? "gold" : "purple",
    win = connectWinner(board);
  useEffect(() => {
    if (win && win !== "draw") onScore(100);
  }, [win]);
  return (
    <div>
      <Controls score="2 players" onReset={() => setBoard(fresh())} />
      <p className="game-instruction">
        Share your screen. Choose a column to drop a disc.
      </p>
      <div className="connect-board">
        {board.flat().map((v, i) => (
          <button
            key={i}
            aria-label={"Drop in column " + ((i % 7) + 1)}
            onClick={() => {
              if (win) return;
              const c = i % 7;
              let r = 5;
              while (r >= 0 && board[r][c]) r--;
              if (r < 0) return;
              const next = board.map((row) => [...row]);
              next[r][c] = turn;
              setBoard(next);
            }}
          >
            <span className={v || ""} />
          </button>
        ))}
      </div>
      <p className="game-message">
        {win
          ? win === "draw"
            ? "It’s a draw!"
            : win + " player wins!"
          : turn + " player’s turn"}
      </p>
    </div>
  );
}
function CanvasArcade({ type, onScore }) {
  const ref = useRef(),
    state = useRef(),
    [running, setRunning] = useState(false),
    [score, setScore] = useState(0),
    [status, setStatus] = useState("Press Play to start"),
    keys = useRef({});
  function reset() {
    state.current = {
      ball: {
        x: 320,
        y: 230,
        vx: type === "pong" ? 4 : 3,
        vy: type === "pong" ? 2 : -3,
      },
      paddle: 250,
      enemy: 170,
      bricks: Array.from({ length: 40 }, (_, i) => ({
        x: 35 + (i % 8) * 72,
        y: 45 + Math.floor(i / 8) * 27,
        alive: true,
      })),
      score: 0,
      enemyScore: 0,
      over: false,
    };
    setScore(0);
    setStatus("Press Play to start");
    setRunning(false);
  }
  useEffect(() => {
    reset();
    const down = (e) => {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
            e.key,
          )
        ) {
          e.preventDefault();
          keys.current[e.key] = true;
        }
      },
      up = (e) => (keys.current[e.key] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [type]);
  useEffect(() => {
    let raf,
      last = 0;
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    function frame(time) {
      raf = requestAnimationFrame(frame);
      if (time - last < 16) return;
      const factor = Math.min((time - last) / 16.67, 2);
      last = time;
      const s = state.current;
      if (!s) return;
      const b = s.ball;
      if (running && !s.over) {
        if (type === "pong") {
          s.paddle +=
            ((keys.current.ArrowDown ? 1 : 0) -
              (keys.current.ArrowUp ? 1 : 0)) *
            7 *
            factor;
          s.paddle = Math.max(0, Math.min(342, s.paddle));
          s.enemy += Math.sign(b.y - s.enemy - 44) * 2.8 * factor;
          s.enemy = Math.max(0, Math.min(342, s.enemy));
        } else {
          s.paddle +=
            ((keys.current.ArrowRight ? 1 : 0) -
              (keys.current.ArrowLeft ? 1 : 0)) *
            7 *
            factor;
          s.paddle = Math.max(0, Math.min(530, s.paddle));
        }
        b.x += b.vx * factor;
        b.y += b.vy * factor;
        if (b.y < 8) {
          b.y = 8;
          b.vy = Math.abs(b.vy);
        }
        if (type === "pong") {
          if (b.y > 422) {
            b.y = 422;
            b.vy = -Math.abs(b.vy);
          }
          if (
            b.vx < 0 &&
            b.x < 29 &&
            b.x > 10 &&
            b.y > s.paddle &&
            b.y < s.paddle + 88
          ) {
            b.x = 29;
            b.vx = Math.abs(b.vx) * 1.04;
            b.vy = (b.y - s.paddle - 44) / 12;
          }
          if (
            b.vx > 0 &&
            b.x > 611 &&
            b.x < 630 &&
            b.y > s.enemy &&
            b.y < s.enemy + 88
          ) {
            b.x = 611;
            b.vx = -Math.abs(b.vx) * 1.04;
          }
          if (b.x < 0 || b.x > 640) {
            if (b.x > 640) {
              s.score++;
              setScore(s.score);
            } else s.enemyScore++;
            if (s.score === 5 || s.enemyScore === 5) {
              s.over = true;
              setRunning(false);
              setStatus(
                s.score === 5 ? "You win!" : "Computer wins. Try again!",
              );
              onScore(s.score * 100);
            } else {
              s.ball = { x: 320, y: 215, vx: b.x > 640 ? -4 : 4, vy: 2 };
              setStatus("You " + s.score + " — Computer " + s.enemyScore);
            }
          }
        } else {
          if (b.x < 8) {
            b.x = 8;
            b.vx = Math.abs(b.vx);
          }
          if (b.x > 632) {
            b.x = 632;
            b.vx = -Math.abs(b.vx);
          }
          if (
            b.vy > 0 &&
            b.y >= 394 &&
            b.y < 415 &&
            b.x > s.paddle &&
            b.x < s.paddle + 110
          ) {
            b.y = 393;
            b.vy = -Math.abs(b.vy);
            b.vx = (b.x - s.paddle - 55) / 14;
          }
          for (const brick of s.bricks)
            if (
              brick.alive &&
              b.x > brick.x - 6 &&
              b.x < brick.x + 66 &&
              b.y > brick.y - 6 &&
              b.y < brick.y + 24
            ) {
              brick.alive = false;
              b.vy *= -1;
              s.score += 25;
              setScore(s.score);
              break;
            }
          if (b.y > 440 || s.bricks.every((x) => !x.alive)) {
            s.over = true;
            setRunning(false);
            setStatus(
              b.y > 440
                ? "Game over. One more round?"
                : "Every brick cleared! You win!",
            );
            onScore(s.score);
          }
        }
      }
      ctx.fillStyle = "#12141c";
      ctx.fillRect(0, 0, 640, 430);
      ctx.fillStyle = "#ffffff08";
      for (let x = 0; x < 640; x += 24)
        for (let y = 0; y < 430; y += 24) ctx.fillRect(x, y, 1, 1);
      if (type === "pong") {
        ctx.setLineDash([8, 12]);
        ctx.strokeStyle = "#ffffff30";
        ctx.beginPath();
        ctx.moveTo(320, 0);
        ctx.lineTo(320, 430);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#bafa72";
        ctx.fillRect(15, s.paddle, 10, 88);
        ctx.fillStyle = "#b9a0f5";
        ctx.fillRect(615, s.enemy, 10, 88);
      } else {
        for (const brick of s.bricks)
          if (brick.alive) {
            ctx.fillStyle = [
              "#b9a0f5",
              "#f397b0",
              "#f8b477",
              "#f9d778",
              "#bafa72",
            ][Math.floor((brick.y - 45) / 27)];
            ctx.beginPath();
            ctx.roundRect(brick.x, brick.y, 64, 18, 4);
            ctx.fill();
          }
        ctx.fillStyle = "#bafa72";
        ctx.beginPath();
        ctx.roundRect(s.paddle, 400, 110, 10, 5);
        ctx.fill();
      }
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, type]);
  function pointer(e) {
    const rect = ref.current.getBoundingClientRect();
    const s = state.current;
    if (!s) return;
    if (type === "pong")
      s.paddle = Math.max(
        0,
        Math.min(342, ((e.clientY - rect.top) * 430) / rect.height - 44),
      );
    else
      s.paddle = Math.max(
        0,
        Math.min(530, ((e.clientX - rect.left) * 640) / rect.width - 55),
      );
  }
  return (
    <div>
      <Controls score={score} onReset={reset}>
        <button
          disabled={state.current?.over}
          className="btn primary"
          onClick={() => {
            setRunning(!running);
            setStatus(
              running
                ? "Paused"
                : type === "pong"
                  ? "First to 5 wins"
                  : "Clear all 40 bricks",
            );
          }}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}{" "}
          {running ? "Pause" : "Play"}
        </button>
      </Controls>
      <canvas
        width="640"
        height="430"
        ref={ref}
        onPointerMove={pointer}
        onPointerDown={pointer}
        className="arcade-canvas"
      />
      <p className="game-message">{status}</p>
      <p className="game-instruction">
        {type === "pong" ? "↑ ↓ move your paddle" : "← → move your paddle"} ·
        Mouse or touch also works
      </p>
    </div>
  );
}
function Reaction({ onScore }) {
  const [phase, setPhase] = useState("idle"),
    [ms, setMs] = useState(0),
    timer = useRef(),
    start = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function click() {
    if (phase === "idle" || phase === "result" || phase === "early") {
      setPhase("waiting");
      timer.current = setTimeout(
        () => {
          start.current = performance.now();
          setPhase("ready");
        },
        1800 + Math.random() * 3500,
      );
    } else if (phase === "waiting") {
      clearTimeout(timer.current);
      setPhase("early");
    } else {
      const n = Math.round(performance.now() - start.current);
      setMs(n);
      setPhase("result");
      onScore(Math.max(0, 1000 - n));
    }
  }
  return (
    <div>
      <button className={"reaction-zone phase-" + phase} onClick={click}>
        {phase === "ready" ? (
          <>
            <span>⚡</span>
            <h2>Click now!</h2>
          </>
        ) : phase === "waiting" ? (
          <>
            <span>◌</span>
            <h2>Wait for green…</h2>
            <p>Patience, player.</p>
          </>
        ) : phase === "early" ? (
          <>
            <h2>A little too eager!</h2>
            <p>Click to try again.</p>
          </>
        ) : phase === "result" ? (
          <>
            <h2>
              {ms} <small>ms</small>
            </h2>
            <p>
              {ms < 250
                ? "Lightning fast."
                : ms < 400
                  ? "Nice reflexes!"
                  : "Warm up and try again."}
            </p>
            <small>Click for another round</small>
          </>
        ) : (
          <>
            <span>⚡</span>
            <h2>Test your reflexes</h2>
            <p>When the panel turns green, click as fast as you can.</p>
            <small>Click to begin</small>
          </>
        )}
      </button>
    </div>
  );
}
const QUESTIONS = [
  [
    "Which planet is known as the Red Planet?",
    ["Venus", "Mars", "Jupiter", "Mercury"],
    1,
  ],
  [
    "What is the largest ocean?",
    ["Atlantic", "Indian", "Pacific", "Arctic"],
    2,
  ],
  ["How many sides does a hexagon have?", ["5", "6", "7", "8"], 1],
  [
    "Who created Minecraft?",
    ["Markus Persson", "Shigeru Miyamoto", "Gabe Newell", "Hideo Kojima"],
    0,
  ],
  ["Which element has the symbol O?", ["Gold", "Iron", "Oxygen", "Silver"], 2],
  ["What year was Tetris first released?", ["1978", "1984", "1990", "1996"], 1],
  ["What is the square root of 144?", ["10", "11", "12", "14"], 2],
  ["Which country invented paper?", ["Egypt", "Greece", "China", "India"], 2],
  ["What is the smallest prime number?", ["0", "1", "2", "3"], 2],
  ["How many hearts does an octopus have?", ["1", "2", "3", "4"], 2],
  [
    "Which language runs natively in a web browser?",
    ["JavaScript", "Python", "C++", "Rust"],
    0,
  ],
  [
    "A group of crows is called a…",
    ["Parliament", "Murder", "School", "Pack"],
    1,
  ],
  [
    "Which game features a Master Sword?",
    ["Halo", "Zelda", "Sonic", "Portal"],
    1,
  ],
  [
    "The speed of light is approximately…",
    ["300,000 km/s", "30,000 km/s", "3,000 km/s", "300 km/s"],
    0,
  ],
  [
    "What does CPU stand for?",
    [
      "Central Processing Unit",
      "Computer Power Utility",
      "Core Program Unit",
      "Central Pixel Unit",
    ],
    0,
  ],
];
function Quiz({ onScore }) {
  const fresh = () => ({
    questions: shuffle(QUESTIONS).slice(0, 10),
    i: 0,
    score: 0,
    choice: null,
  });
  const [s, setS] = useState(fresh);
  const done = s.i === 10,
    q = s.questions[s.i];
  useEffect(() => {
    if (done) onScore(s.score * 100);
  }, [done]);
  return (
    <div>
      <Controls score={s.score + "/10"} onReset={() => setS(fresh())} />
      {done ? (
        <div className="quiz-finish">
          <span>🏆</span>
          <h2>{s.score} out of 10</h2>
          <p>
            {s.score >= 8
              ? "You know your stuff!"
              : "A few new facts for your next quest."}
          </p>
        </div>
      ) : (
        <div className="quiz">
          <span className="eyebrow">QUESTION {s.i + 1} OF 10</span>
          <div className="progress-track">
            <div style={{ width: (s.i + 1) * 10 + "%" }} />
          </div>
          <h2>{q[0]}</h2>
          <div className="quiz-options">
            {q[1].map((text, i) => (
              <button
                key={i}
                className={
                  s.choice !== null
                    ? i === q[2]
                      ? "answer-correct"
                      : i === s.choice
                        ? "answer-wrong"
                        : ""
                    : ""
                }
                disabled={s.choice !== null}
                onClick={() =>
                  setS({
                    ...s,
                    choice: i,
                    score: s.score + (i === q[2] ? 1 : 0),
                  })
                }
              >
                <span>{"ABCD"[i]}</span>
                {text}
                {s.choice !== null && i === q[2] && <Check size={20} />}
              </button>
            ))}
          </div>
          {s.choice !== null && (
            <button
              className="btn primary"
              onClick={() => setS({ ...s, i: s.i + 1, choice: null })}
            >
              {s.i === 9 ? "See results" : "Next question"} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
const SUDOKU_SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    .split("")
    .map(Number);
const SUDOKU_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
    .split("")
    .map(Number);
function Sudoku({ onScore }) {
  const [board, setBoard] = useState([...SUDOKU_PUZZLE]),
    [selected, setSelected] = useState(null),
    [message, setMessage] = useState(""),
    [check, setCheck] = useState(false);
  const won = board.every((v, i) => v === SUDOKU_SOLUTION[i]);
  useEffect(() => {
    if (won) {
      setMessage("Every number in its place. You solved it!");
      onScore(1000);
    }
  }, [won]);
  function fill(n) {
    if (selected === null || SUDOKU_PUZZLE[selected] || won) return;
    setBoard((p) => p.map((v, i) => (i === selected ? n : v)));
    setCheck(false);
  }
  useKeys((k) => {
    if (/^[1-9]$/.test(k)) fill(Number(k));
    if (k === "Backspace" || k === "Delete") fill(0);
  });
  return (
    <div>
      <Controls
        score={board.filter(Boolean).length + "/81"}
        onReset={() => {
          setBoard([...SUDOKU_PUZZLE]);
          setMessage("");
          setCheck(false);
        }}
      >
        <button
          className="btn secondary"
          onClick={() => {
            setCheck(true);
            setMessage(
              board.some((v, i) => v && v !== SUDOKU_SOLUTION[i])
                ? "Highlighted numbers need another look."
                : "Looking good so far!",
            );
          }}
        >
          Check
        </button>
      </Controls>
      <div className="sudoku-board">
        {board.map((v, i) => (
          <button
            key={i}
            aria-label={
              "Row " + (Math.floor(i / 9) + 1) + " column " + ((i % 9) + 1)
            }
            style={{
              borderRight:
                i % 9 === 2 || i % 9 === 5 ? "2px solid #676475" : undefined,
              borderBottom:
                Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5
                  ? "2px solid #676475"
                  : undefined,
            }}
            className={
              (SUDOKU_PUZZLE[i] ? "given " : "") +
              (selected === i ? "selected " : "") +
              (check && v && v !== SUDOKU_SOLUTION[i] ? "wrong" : "")
            }
            onClick={() => setSelected(i)}
          >
            {v || ""}
          </button>
        ))}
      </div>
      <div className="number-pad">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} onClick={() => fill(i + 1)}>
            {i + 1}
          </button>
        ))}
        <button aria-label="Erase number" onClick={() => fill(0)}>
          <Delete size={18} />
        </button>
      </div>
      <p className="game-message">
        {message ||
          "Select a cell, then enter 1–9. Each row, column and box uses every digit once."}
      </p>
    </div>
  );
}
export function GamePlayer({ game, onScore }) {
  switch (game.id) {
    case "hangman":
      return <Hangman onScore={onScore} />;
    case "fifteen-puzzle":
      return <FifteenPuzzle onScore={onScore} />;
    case "wordle":
      return <Wordle onScore={onScore} />;
    case "tetris":
      return <Tetris onScore={onScore} />;
    case "snake":
      return <Snake onScore={onScore} />;
    case "2048":
      return <G2048 onScore={onScore} />;
    case "minesweeper":
      return <Minesweeper onScore={onScore} />;
    case "memory":
      return <Memory onScore={onScore} />;
    case "tic-tac-toe":
      return <TTT onScore={onScore} />;
    case "connect-four":
      return <Connect onScore={onScore} />;
    case "pong":
    case "breakout":
      return <CanvasArcade type={game.id} onScore={onScore} />;
    case "reaction":
      return <Reaction onScore={onScore} />;
    case "quiz":
      return <Quiz onScore={onScore} />;
    case "sudoku":
      return <Sudoku onScore={onScore} />;
    default:
      return null;
  }
}
