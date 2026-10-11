import test from "node:test";
import assert from "node:assert/strict";
import {
  dailyWord,
  wordColors,
  slide2048,
  has2048Moves,
  winner,
  connectWinner,
  WORDS,
  VALID_GUESSES,
  SOLVED_PUZZLE,
  slidePuzzle,
  shufflePuzzle,
  puzzleSolved,
} from "../src/gameLogic.js";
test("expanded Wordle accepts dictionary guesses and preserves today's answer", () => {
  assert.ok(VALID_GUESSES.size > 14000);
  assert.ok(WORDS.length > 1500);
  assert.equal(new Set(WORDS).size, WORDS.length);
  assert.ok(
    WORDS.every((word) => /^[A-Z]{5}$/.test(word) && VALID_GUESSES.has(word)),
  );
  assert.ok([...VALID_GUESSES].every((word) => /^[A-Z]{5}$/.test(word)));
  for (const word of ["ABBEY", "BERRY", "ZESTY", "REBUT", "ADIEU"])
    assert.ok(VALID_GUESSES.has(word));
  assert.equal(VALID_GUESSES.has("XXXXX"), false);
  assert.equal(dailyWord(new Date("2026-10-11T23:59:59Z")), "KNIFE");
  const answers = new Set();
  for (let day = 0; day < 1000; day++) {
    const date = new Date(Date.UTC(2026, 9, 12) + day * 86400000);
    assert.ok(WORDS.includes(dailyWord(date)));
    answers.add(dailyWord(date));
  }
  assert.equal(answers.size, 1000);
});
test("sliding puzzle allows neighbours without wrapping rows", () => {
  assert.ok(puzzleSolved(SOLVED_PUZZLE));
  const moved = slidePuzzle(SOLVED_PUZZLE, 14);
  assert.deepEqual(moved.slice(12), [13, 14, 0, 15]);
  assert.equal(slidePuzzle(SOLVED_PUZZLE, 0), SOLVED_PUZZLE);
  const edge = slidePuzzle(slidePuzzle(slidePuzzle(SOLVED_PUZZLE, 14), 13), 12);
  assert.equal(slidePuzzle(edge, 11), edge);
  assert.ok(puzzleSolved(slidePuzzle(moved, 15)));
});
test("every generated 15 puzzle is solvable and starts unsolved", () => {
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed;
    const board = shufflePuzzle(() => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    });
    assert.deepEqual(
      [...board].sort((a, b) => a - b),
      Array.from({ length: 16 }, (_, i) => i),
    );
    assert.equal(puzzleSolved(board), false);
    const numbers = board.filter(Boolean);
    const inversions = numbers.reduce(
      (sum, value, index) =>
        sum + numbers.slice(index + 1).filter((next) => next < value).length,
      0,
    );
    const blankRowFromBottom = 4 - Math.floor(board.indexOf(0) / 4);
    assert.equal((inversions + blankRowFromBottom) % 2, 1);
  }
});
test("daily Wordle is stable within a UTC day and changes tomorrow", () => {
  const morning = new Date("2026-10-10T00:00:00Z"),
    evening = new Date("2026-10-10T23:59:59Z");
  assert.equal(dailyWord(morning), dailyWord(evening));
  assert.notEqual(
    dailyWord(morning),
    dailyWord(new Date("2026-10-11T00:00:00Z")),
  );
  assert.ok(WORDS.includes(dailyWord(morning)));
});
test("Wordle repeated letters only consume available answer letters", () => {
  assert.deepEqual(wordColors("APPLE", "ALARM"), [
    "correct",
    "absent",
    "absent",
    "present",
    "absent",
  ]);
  assert.deepEqual(wordColors("SHEEP", "SPEED"), [
    "correct",
    "absent",
    "correct",
    "correct",
    "present",
  ]);
});
test("2048 merges each pair once per move in all directions", () => {
  const b = [
    [2, 2, 2, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.deepEqual(slide2048(b, "left").board[0], [4, 4, 0, 0]);
  assert.equal(slide2048(b, "left").score, 8);
  assert.deepEqual(slide2048(b, "right").board[0], [0, 0, 4, 4]);
  const vertical = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  assert.deepEqual(
    slide2048(vertical, "down").board.map((r) => r[0]),
    [0, 0, 4, 8],
  );
  assert.equal(b[0][0], 2);
});
test("2048 detects a full board with no legal move", () => {
  assert.equal(
    has2048Moves([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]),
    false,
  );
  assert.equal(
    has2048Moves([
      [2, 2, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]),
    true,
  );
});
test("tic tac toe detects wins and a genuine draw", () => {
  assert.equal(winner(["X", "O", null, "O", "X", null, null, null, "X"]), "X");
  assert.equal(winner(["X", "O", "X", "X", "O", "O", "O", "X", "X"]), "draw");
  assert.equal(winner(Array(9).fill(null)), null);
});
test("Connect Four detects diagonals without wrapping columns", () => {
  const b = Array.from({ length: 6 }, () => Array(7).fill(null));
  for (let i = 0; i < 4; i++) b[5 - i][i] = "gold";
  assert.equal(connectWinner(b), "gold");
  b[2][3] = null;
  assert.equal(connectWinner(b), null);
});
