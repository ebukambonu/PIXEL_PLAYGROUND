# Pixel Playground

An arcade and community website with 15 playable games, 8 utility apps, persistent accounts, shared chat, a 22-item play-coin shop, and owner administration. The design includes a responsive dark dashboard and unlockable themes.

## Google Sites and Supabase

The current requested deployment uses Google Sites for display, Supabase Storage for frontend assets, Supabase Edge Functions for the API, and Supabase PostgreSQL for persistent data. Vercel is not required. [Follow the deployment and data migration guide](deployment/SUPABASE.md). Configure the public function URL and run `npm run build:google-sites`, then publish assets with `npm run publish:google-sites`. The generated small HTML embed loads the full app directly from Supabase.

The prior Render/Koyeb/Vercel deployment guides remain available for alternative Node hosting. PostgreSQL is selected when `PIXEL_DATABASE_URL` or `SUPABASE_DB_URL` is set; Turso and local SQLite remain supported for migration and development. Hosted credentials must be supplied securely.

## Start developing

Use Node.js 24 (includes the SQLite runtime) and npm. The current cloud checkout is `/workspace/PIXEL_PLAYGROUND`.

```sh
npm ci --cache /tmp/pixel-npm-cache --no-audit --no-fund
npm run dev
```

The application listens on port **3000**. Vite serves the React UI, and the same Node process serves the API. Frontend changes update immediately; server changes restart through Node's watch mode. Accounts, messages, coins, inventories, and site settings persist in `data/pixel.db` locally, or in Turso when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are configured. The data directory is ignored by Git. Browser favorites, Wordle progress, and quick notes are local to each browser.

```sh
npm run build
npm test
npm start
```

`npm start` serves the production build on traditional Node hosts. Configure `APP_URL` and use either a persistent volume for `DATABASE_PATH` or Turso. Back up the database with SQLite's backup facilities (include WAL state when copying a live database). Use one application instance for local SQLite files. Vercel uses remote Turso storage, with transactions and database rate limits shared across function instances. Chat uses polling. Existing local SQLite data is preserved.

## Accounts and owners

Players sign up and sign in with usernames and passwords; no email is required. Somkene and Kamneto are the reserved admin usernames. Registering either reserved name grants admin access without a setup code. Anyone can claim an unused admin name, so register both promptly. Roles are stored in the database; existing accounts retain their permissions. Username-only accounts have no email-based password recovery.

The migration tool preserves existing users, password hashes and privileges. Legacy eligible owners can become Somkene/Kamneto while keeping their passwords, IDs and inventory; name collisions stop migration. Shared accounts and chat use the private `pixel_playground` PostgreSQL schema. Google Sites uses bearer sessions to avoid relying on cross-site cookies; ordinary Node hosting retains HttpOnly cookies.

## Features

- Games: daily Wordle, Tetris, Snake, 2048, Minesweeper, Memory Match, Tic Tac Toe (computer or local two-player), Connect Four (local two-player), Pong (computer), Breakout, Reaction Time, Trivia Quest, Sudoku, Hangman, and 15 Puzzle (always shuffled through legal moves so it is solvable).
- Wordle: one deterministic UTC daily puzzle, six guesses, duplicate-letter clues, browser progress persistence, 14,826 accepted dictionary guesses, and 1,737 curated daily answers. It is a custom Wordle-style game. The expanded answer pool starts on 2026-10-12 UTC, preserving the previous schedule before that date. Refresh or reopen the game after midnight for the next puzzle. [Dictionary attribution](licenses/README.md).
- Apps: calculator with parentheses and percentages, world clock, stopwatch with laps, countdown timer, browser notes, unit converter, dice roller, and Pomodoro focus timer.
- Accounts: scrypt password hashes, HttpOnly sessions, username login, welcome coins, and once-per-day coin claims.
- Chat: shared global room, owner-managed chat rooms, message deletion, room clearing, and server-enforced bans. Messages refresh every 2.5 seconds; settings and room changes refresh every 15 seconds.
- Shop: 8 themes and 14 avatars, server-authoritative pricing, inventory, and equip controls. New themes include Forest, Neon, Arctic and Gold; new avatars include an owl, penguin, frog, alien, wizard, octopus, tiger and firebird. Owners can edit every item's name, description, price and availability. Coins have no cash value; no real-money payment gateway is included.
- Admin: player bans/unbans, balances and usernames, global announcements, site text, game visibility and copy, shop availability and prices, room create/edit/delete, maintenance mode, chat pause, shop pause, and an action log.

### Owner commands

```text
/help
/announce Your announcement here
/ban username
/unban username
/coins username 1000
/maintenance on
/maintenance off
/clearchat general
```

The command center accepts these defined operations; it does not execute arbitrary shell commands. Admin forms provide the same editing and moderation controls.

## Validation and practical limits

`npm test` runs API integration tests against an isolated database and game-logic tests. It checks ownership after verification, duplicate accounts, purchase pricing, daily claim limits, chat, moderation, sessions, cross-origin mutations, and game rules. Building first is required for production startup.

The leaderboard stores **player-reported** scores for casual competition, not tamper-proof rankings. Compare scores within a game. Daily puzzles and local notes are browser features. This first version has no password recovery, online multiplayer gameplay, media uploads, paid checkout, or production email provider. Do not treat the cloud process as a published site; publish/deploy separately after configuring email, HTTPS, and database persistence.

The repository's original `code` file has been preserved unchanged.
