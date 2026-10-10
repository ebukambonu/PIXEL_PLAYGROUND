import React, { useState, useEffect, useRef } from "react";
import {
  Calculator,
  Clock3,
  Timer,
  AlarmClock,
  StickyNote,
  ArrowLeftRight,
  Dices,
  Focus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";
export const APP_CATALOG = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Numbers, without the fuss.",
    Icon: Calculator,
    color: "purple",
  },
  {
    id: "clock",
    name: "World Clock",
    description: "A little perspective on time.",
    Icon: Clock3,
    color: "blue",
  },
  {
    id: "stopwatch",
    name: "Stopwatch",
    description: "Every second counts.",
    Icon: Timer,
    color: "green",
  },
  {
    id: "timer",
    name: "Countdown",
    description: "Set it. Focus. Take a break.",
    Icon: AlarmClock,
    color: "orange",
  },
  {
    id: "notes",
    name: "Quick Notes",
    description: "Save a thought for later.",
    Icon: StickyNote,
    color: "pink",
  },
  {
    id: "converter",
    name: "Unit Converter",
    description: "Make sense of measurements.",
    Icon: ArrowLeftRight,
    color: "blue",
  },
  {
    id: "dice",
    name: "Dice Roller",
    description: "Leave a little up to chance.",
    Icon: Dices,
    color: "purple",
  },
  {
    id: "pomodoro",
    name: "Focus Timer",
    description: "A little work. A little play.",
    Icon: Focus,
    color: "green",
  },
];
export function calculate(expression) {
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()%]/g) || [];
  if (tokens.join("") !== expression.replace(/\s/g, ""))
    throw new Error("Use numbers and arithmetic operators.");
  let i = 0;
  function atom() {
    if (tokens[i] === "-") {
      i++;
      return -atom();
    }
    if (tokens[i] === "+") {
      i++;
      return atom();
    }
    let value;
    if (tokens[i] === "(") {
      i++;
      value = sum();
      if (tokens[i++] !== ")") throw new Error("Close your brackets.");
    } else {
      const t = tokens[i++];
      if (!t || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))
        throw new Error("Enter a complete calculation.");
      value = Number(t);
    }
    while (tokens[i] === "%") {
      value /= 100;
      i++;
    }
    return value;
  }
  function product() {
    let n = atom();
    while (tokens[i] === "*" || tokens[i] === "/") {
      const op = tokens[i++],
        v = atom();
      n = op === "*" ? n * v : n / v;
    }
    return n;
  }
  function sum() {
    let n = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++],
        v = product();
      n = op === "+" ? n + v : n - v;
    }
    return n;
  }
  const result = sum();
  if (i !== tokens.length || !Number.isFinite(result))
    throw new Error("That calculation is undefined.");
  return Number(result.toPrecision(12));
}
function Calc() {
  const [value, setValue] = useState(""),
    [result, setResult] = useState("0"),
    [error, setError] = useState("");
  function key(k) {
    setError("");
    if (k === "AC") {
      setValue("");
      setResult("0");
    } else if (k === "⌫") setValue((v) => v.slice(0, -1));
    else if (k === "=") {
      try {
        setResult(String(calculate(value)));
      } catch (e) {
        setError(e.message);
      }
    } else setValue((v) => (v.length < 120 ? v + k : v));
  }
  return (
    <div className="calculator">
      <div className="calc-display">
        <input
          aria-label="Calculation"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 120))}
          onKeyDown={(e) => {
            if (e.key === "Enter") key("=");
          }}
        />
        <strong>{result}</strong>
      </div>
      <div className="calc-keys">
        {[
          "AC",
          "(",
          ")",
          "⌫",
          "7",
          "8",
          "9",
          "/",
          "4",
          "5",
          "6",
          "*",
          "1",
          "2",
          "3",
          "-",
          "0",
          ".",
          "%",
          "+",
        ].map((k) => (
          <button
            className={["/", "*", "-", "+"].includes(k) ? "operator" : ""}
            key={k}
            onClick={() => key(k)}
          >
            {k === "*" ? "×" : k === "/" ? "÷" : k}
          </button>
        ))}
        <button className="equals" onClick={() => key("=")}>
          =
        </button>
      </div>
      <p className="game-message">{error}</p>
    </div>
  );
}
function WorldClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const zones = [
    ["Your local time", Intl.DateTimeFormat().resolvedOptions().timeZone],
    ["London", "Europe/London"],
    ["New York", "America/New_York"],
    ["Tokyo", "Asia/Tokyo"],
    ["Sydney", "Australia/Sydney"],
    ["Lagos", "Africa/Lagos"],
  ];
  return (
    <div className="world-clocks">
      {zones.map(([name, zone], i) => (
        <div key={name} className={i === 0 ? "local-clock" : ""}>
          <span>{name}</span>
          <strong>
            {now.toLocaleTimeString("en-GB", {
              timeZone: zone,
              hour: "2-digit",
              minute: "2-digit",
              second: i === 0 ? "2-digit" : undefined,
            })}
          </strong>
          <small>
            {now.toLocaleDateString("en-GB", {
              timeZone: zone,
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </small>
        </div>
      ))}
    </div>
  );
}
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return (
    String(Math.floor(seconds / 3600)).padStart(2, "0") +
    ":" +
    String(Math.floor(seconds / 60) % 60).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}
function Stopwatch() {
  const [ms, setMs] = useState(0),
    [running, setRunning] = useState(false),
    [laps, setLaps] = useState([]),
    base = useRef(0),
    start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const t = setInterval(
      () => setMs(base.current + performance.now() - start.current),
      30,
    );
    return () => {
      clearInterval(t);
      base.current += performance.now() - start.current;
    };
  }, [running]);
  return (
    <div className="time-app">
      <span className="eyebrow">MAKE EVERY SECOND COUNT</span>
      <div className="time-digits">
        {formatTime(ms)}
        <small>.{String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}</small>
      </div>
      <div className="button-row">
        <button className="btn primary" onClick={() => setRunning(!running)}>
          {running ? <Pause size={17} /> : <Play size={17} />}{" "}
          {running ? "Pause" : "Start"}
        </button>
        <button
          className="btn secondary"
          disabled={!ms}
          onClick={() => setLaps([...laps, ms])}
        >
          Lap
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            setRunning(false);
            base.current = 0;
            setTimeout(() => {
              base.current = 0;
              setMs(0);
            }, 0);
            setLaps([]);
          }}
        >
          <RotateCcw size={17} />
          Reset
        </button>
      </div>
      <div className="lap-list">
        {laps.map((lap, i) => (
          <div key={i}>
            <span>Lap {i + 1}</span>
            <strong>
              {formatTime(lap)}.
              {String(Math.floor((lap % 1000) / 10)).padStart(2, "0")}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
function Countdown({ focus = false }) {
  const [minutes, setMinutes] = useState(focus ? 25 : 5),
    [seconds, setSeconds] = useState((focus ? 25 : 5) * 60),
    [running, setRunning] = useState(false),
    [done, setDone] = useState(false);
  const end = useRef(0),
    remaining = useRef(seconds);
  useEffect(() => {
    remaining.current = seconds;
  }, [seconds]);
  useEffect(() => {
    if (!running) return;
    end.current = Date.now() + remaining.current * 1000;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      setSeconds(left);
      if (!left) {
        setRunning(false);
        setDone(true);
      }
    }, 200);
    return () => clearInterval(t);
  }, [running]);
  function preset(m) {
    setRunning(false);
    setMinutes(m);
    setSeconds(m * 60);
    remaining.current = m * 60;
    setDone(false);
  }
  return (
    <div className="time-app">
      <span className="eyebrow">
        {focus ? "ONE THING AT A TIME" : "YOUR TIME, YOUR PACE"}
      </span>
      {focus && (
        <div className="focus-presets">
          {[
            [25, "Focus"],
            [5, "Short break"],
            [15, "Long break"],
          ].map(([m, label]) => (
            <button
              key={m}
              className={minutes === m ? "active" : ""}
              onClick={() => preset(m)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="time-digits">
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </div>
      {!focus && (
        <label className="minutes-input">
          Minutes{" "}
          <input
            type="number"
            min="1"
            max="1440"
            value={minutes}
            disabled={running}
            onChange={(e) =>
              preset(Math.max(1, Math.min(1440, Number(e.target.value) || 1)))
            }
          />
        </label>
      )}
      <div className="button-row">
        <button
          className="btn primary"
          disabled={!seconds}
          onClick={() => {
            setDone(false);
            setRunning(!running);
          }}
        >
          {running ? <Pause size={17} /> : <Play size={17} />}{" "}
          {running ? "Pause" : "Start"}
        </button>
        <button className="btn secondary" onClick={() => preset(minutes)}>
          <RotateCcw size={17} />
          Reset
        </button>
      </div>
      <p className="game-message" role="status">
        {done
          ? "Time’s up! You’ve earned a moment to yourself."
          : focus
            ? "Stay here. Pick one task. You’ve got this."
            : ""}
      </p>
    </div>
  );
}
function Notes() {
  const [notes, setNotes] = useState(() => {
      try {
        return (
          JSON.parse(localStorage.getItem("pixel-notes")) || [
            {
              id: Date.now(),
              title: "A little space for your thoughts",
              text: "",
            },
          ]
        );
      } catch {
        return [];
      }
    }),
    [active, setActive] = useState(0);
  useEffect(
    () => localStorage.setItem("pixel-notes", JSON.stringify(notes)),
    [notes],
  );
  const note = notes[active];
  function update(key, value) {
    setNotes(notes.map((n, i) => (i === active ? { ...n, [key]: value } : n)));
  }
  return (
    <div className="notes-app">
      <div className="notes-list">
        {notes.map((n, i) => (
          <button
            className={i === active ? "active" : ""}
            key={n.id}
            onClick={() => setActive(i)}
          >
            <StickyNote size={15} />
            {n.title || "Untitled"}
          </button>
        ))}
        <button
          className="btn secondary"
          onClick={() => {
            setNotes([...notes, { id: Date.now(), title: "", text: "" }]);
            setActive(notes.length);
          }}
        >
          <Plus size={15} />
          New note
        </button>
      </div>
      {note ? (
        <div className="note-editor">
          <input
            aria-label="Note title"
            placeholder="Untitled note"
            value={note.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <textarea
            aria-label="Note content"
            placeholder="What’s on your mind?"
            value={note.text}
            onChange={(e) => update("text", e.target.value)}
          />
          <div>
            <small>Saved automatically in this browser</small>
            <button
              className="icon-button"
              aria-label="Delete note"
              onClick={() => {
                setNotes(notes.filter((_, i) => i !== active));
                setActive(0);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <p>Create a note to get started.</p>
      )}
    </div>
  );
}
const UNITS = {
  Length: {
    Meters: 1,
    Kilometers: 1000,
    Centimeters: 0.01,
    Millimeters: 0.001,
    Miles: 1609.344,
    Feet: 0.3048,
    Inches: 0.0254,
  },
  Weight: {
    Kilograms: 1,
    Grams: 0.001,
    Pounds: 0.45359237,
    Ounces: 0.028349523125,
  },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  Data: {
    Bytes: 1,
    Kilobytes: 1024,
    Megabytes: 1048576,
    Gigabytes: 1073741824,
  },
};
export function convert(value, category, from, to) {
  if (category === "Temperature") {
    const c =
      from === "Celsius"
        ? value
        : from === "Fahrenheit"
          ? ((value - 32) * 5) / 9
          : value - 273.15;
    return to === "Celsius"
      ? c
      : to === "Fahrenheit"
        ? (c * 9) / 5 + 32
        : c + 273.15;
  }
  return (value * UNITS[category][from]) / UNITS[category][to];
}
function Converter() {
  const [category, setCategory] = useState("Length"),
    [value, setValue] = useState("1"),
    [from, setFrom] = useState("Meters"),
    [to, setTo] = useState("Feet");
  const result = convert(Number(value), category, from, to);
  return (
    <div className="converter">
      <div className="focus-presets">
        {Object.keys(UNITS).map((c) => (
          <button
            key={c}
            className={c === category ? "active" : ""}
            onClick={() => {
              setCategory(c);
              const units = Object.keys(UNITS[c]);
              setFrom(units[0]);
              setTo(units[1]);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="conversion-row">
        <div>
          <label>FROM</label>
          <input
            aria-label="Value to convert"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <select
            value={from}
            aria-label="From unit"
            onChange={(e) => setFrom(e.target.value)}
          >
            {Object.keys(UNITS[category]).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <button
          className="icon-button"
          aria-label="Swap units"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <ArrowLeftRight />
        </button>
        <div>
          <label>TO</label>
          <strong>
            {Number.isFinite(result)
              ? Number(result.toPrecision(9)).toLocaleString()
              : "—"}
          </strong>
          <select
            value={to}
            aria-label="To unit"
            onChange={(e) => setTo(e.target.value)}
          >
            {Object.keys(UNITS[category]).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
function Dice() {
  const [count, setCount] = useState(2),
    [sides, setSides] = useState(6),
    [rolls, setRolls] = useState([1, 1]),
    [rolling, setRolling] = useState(false),
    timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function roll() {
    setRolling(true);
    timer.current = setTimeout(() => {
      const values = new Uint32Array(count);
      crypto.getRandomValues(values);
      setRolls([...values].map((v) => (v % sides) + 1));
      setRolling(false);
    }, 250);
  }
  return (
    <div className="dice-app">
      <div className="dice-settings">
        <label>
          Dice{" "}
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          Sides{" "}
          <select
            value={sides}
            onChange={(e) => setSides(Number(e.target.value))}
          >
            {[4, 6, 8, 10, 12, 20].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={"dice-results " + (rolling ? "rolling" : "")}>
        {rolls.map((n, i) => (
          <div key={i}>{sides === 6 ? "⚀⚁⚂⚃⚄⚅"[n - 1] : n}</div>
        ))}
      </div>
      <p className="dice-total">
        Total <strong>{rolls.reduce((a, b) => a + b, 0)}</strong>
      </p>
      <button className="btn primary" disabled={rolling} onClick={roll}>
        <Dices size={18} />
        Roll the dice
      </button>
    </div>
  );
}
export function AppPlayer({ app }) {
  switch (app.id) {
    case "calculator":
      return <Calc />;
    case "clock":
      return <WorldClock />;
    case "stopwatch":
      return <Stopwatch />;
    case "timer":
      return <Countdown />;
    case "pomodoro":
      return <Countdown focus />;
    case "notes":
      return <Notes />;
    case "converter":
      return <Converter />;
    case "dice":
      return <Dice />;
    default:
      return null;
  }
}
