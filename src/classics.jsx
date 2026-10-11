import React, { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { shufflePuzzle, slidePuzzle, puzzleSolved } from "./gameLogic";

const HANGMAN_WORDS = [
  "ARCADE",
  "ADVENTURE",
  "BALLOON",
  "BICYCLE",
  "BUTTERFLY",
  "CALENDAR",
  "CHAMPION",
  "CHOCOLATE",
  "COMPUTER",
  "DINOSAUR",
  "DOLPHIN",
  "DRAGON",
  "ELEPHANT",
  "FESTIVAL",
  "FIREFLY",
  "GALAXY",
  "GARDEN",
  "GUITAR",
  "HORIZON",
  "ISLAND",
  "JOURNEY",
  "JUNGLE",
  "KEYBOARD",
  "LANTERN",
  "LIBRARY",
  "LIGHTHOUSE",
  "MOUNTAIN",
  "NOTEBOOK",
  "OCTOPUS",
  "ORCHESTRA",
  "PENGUIN",
  "PLANET",
  "POPCORN",
  "PUZZLE",
  "RAINBOW",
  "ROCKET",
  "SATELLITE",
  "SNOWFLAKE",
  "SUNFLOWER",
  "TELESCOPE",
  "TREASURE",
  "TURTLE",
  "UMBRELLA",
  "UNICORN",
  "VOLCANO",
  "WATERFALL",
  "WHISPER",
  "WIZARD",
];
const chooseWord = () =>
  HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];

function Toolbar({ score, reset }) {
  return (
    <div className="game-controls">
      <div className="game-score">
        <span>SCORE</span>
        <strong>{score}</strong>
      </div>
      <button className="btn secondary" onClick={reset}>
        <RotateCcw size={15} />
        New game
      </button>
    </div>
  );
}

export function Hangman({ onScore }) {
  const [word, setWord] = useState(chooseWord);
  const [guesses, setGuesses] = useState([]);
  const reported = useRef(false);
  const wrong = guesses.filter((letter) => !word.includes(letter)).length;
  const won = [...word].every((letter) => guesses.includes(letter));
  const over = won || wrong >= 6;
  const score = won ? (7 - wrong) * 100 : 0;
  const guess = (letter) => {
    if (!over && /^[A-Z]$/.test(letter))
      setGuesses((current) =>
        current.includes(letter) ? current : [...current, letter],
      );
  };
  useEffect(() => {
    const listener = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
        return;
      guess(event.key.toUpperCase());
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  useEffect(() => {
    if (won && !reported.current) {
      reported.current = true;
      onScore(score);
    }
  }, [won, score, onScore]);
  const reset = () => {
    reported.current = false;
    setWord(chooseWord());
    setGuesses([]);
  };
  return (
    <div className="hangman-game">
      <p className="game-instruction">
        Guess a letter using your keyboard or the buttons. Six mistakes ends the
        round.
      </p>
      <svg
        className="hangman-drawing"
        viewBox="0 0 200 190"
        role="img"
        aria-label={`${wrong} of 6 mistakes`}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path d="M20 175H120M55 175V15H140V38" />
          {wrong >= 1 && <circle cx="140" cy="57" r="19" />}
          {wrong >= 2 && <path d="M140 76V125" />}
          {wrong >= 3 && <path d="M140 88L113 108" />}
          {wrong >= 4 && <path d="M140 88L167 108" />}
          {wrong >= 5 && <path d="M140 125L120 155" />}
          {wrong >= 6 && <path d="M140 125L160 155" />}
        </g>
      </svg>
      <div className="hangman-word" aria-label="Hidden word">
        {[...word].map((letter, index) => (
          <span
            key={index}
            className={over && !guesses.includes(letter) ? "missed" : ""}
          >
            {guesses.includes(letter) || over ? letter : "_"}
          </span>
        ))}
      </div>
      <p className="game-instruction" role="status">
        {won
          ? "You found it!"
          : over
            ? `The word was ${word}. Try another round!`
            : `${6 - wrong} mistakes remaining`}
      </p>
      <div className="hangman-keyboard">
        {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => (
          <button
            key={letter}
            disabled={over || guesses.includes(letter)}
            className={
              guesses.includes(letter)
                ? word.includes(letter)
                  ? "correct"
                  : "absent"
                : ""
            }
            onClick={() => guess(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      <Toolbar score={score} reset={reset} />
    </div>
  );
}

export function FifteenPuzzle({ onScore }) {
  const [state, setState] = useState(() => ({
    board: shufflePuzzle(),
    moves: 0,
  }));
  const reported = useRef(false);
  const won = puzzleSolved(state.board);
  const score = won ? Math.max(100, 3000 - state.moves * 10) : 0;
  const move = (index) =>
    setState((current) => {
      if (puzzleSolved(current.board)) return current;
      const board = slidePuzzle(current.board, index);
      return board === current.board
        ? current
        : { board, moves: current.moves + 1 };
    });
  useEffect(() => {
    const listener = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
        return;
      const offsets = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -4,
        ArrowDown: 4,
      };
      if (offsets[event.key] === undefined) return;
      event.preventDefault();
      move(state.board.indexOf(0) + offsets[event.key]);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [state.board]);
  useEffect(() => {
    if (won && !reported.current) {
      reported.current = true;
      onScore(score);
    }
  }, [won, score, onScore]);
  const reset = () => {
    reported.current = false;
    setState({ board: shufflePuzzle(), moves: 0 });
  };
  return (
    <div className="fifteen-game">
      <p className="game-instruction">
        Arrange 1–15 in order with the empty space last. Click a neighbouring
        tile, or use arrows to move the empty space.
      </p>
      <div className="fifteen-board" aria-label="Sliding puzzle">
        {state.board.map((tile, index) => (
          <button
            key={index}
            className={!tile ? "blank" : tile === index + 1 ? "placed" : ""}
            disabled={
              !tile || won || slidePuzzle(state.board, index) === state.board
            }
            aria-label={tile ? `Move tile ${tile}` : "Empty space"}
            onClick={() => move(index)}
          >
            {tile || ""}
          </button>
        ))}
      </div>
      <p className="game-instruction" role="status">
        {won ? `Solved in ${state.moves} moves!` : `${state.moves} moves`}
      </p>
      <Toolbar score={score} reset={reset} />
    </div>
  );
}
