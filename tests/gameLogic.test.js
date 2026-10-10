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
} from "../src/gameLogic.js";
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
