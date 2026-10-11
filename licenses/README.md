# Wordle dictionary attribution

`src/wordleGuesses.json` is derived from [Tab Atkins's wordle-list](https://github.com/tabatkins/wordle-list), retrieved on 2026-10-11. It contains uppercase, deduplicated five-letter guesses with some explicit terms removed. The MIT license is preserved in `wordle-list-MIT.txt`.

The daily answer pool is a separate curated list in `src/gameLogic.js`; the larger guess dictionary is not used directly to choose daily answers. The previous daily schedule is preserved through 2026-10-11 UTC, with the expanded pool starting at the next UTC rollover.
