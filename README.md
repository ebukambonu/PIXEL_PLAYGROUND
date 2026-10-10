# Pixel Playground

An arcade and community website with 13 playable games, 8 utility apps, persistent accounts, shared chat, a play-coin shop, and owner administration. The design includes a responsive dark dashboard and unlockable themes.

## Free public hosting

For a free public site with durable accounts and chat, use Render Free with Turso Free. [Follow the deployment guide](deployment/FREE_HOSTING.md); `render.yaml` declares a free web service and requires the hosted database. A supplied `.onrender.com` address avoids purchasing a custom domain. Free-tier usage limits and cold starts still apply. Brevo is supported for verification email using a sender you can verify without purchasing a domain. External database and email service credentials must be added securely in the hosting dashboard.

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

`npm start` serves the production build. Use a production HTTPS reverse proxy, configure `APP_URL`, and put `DATABASE_PATH` on a persistent volume before public deployment. Back up the database with SQLite's backup facilities (include WAL state when copying a live database). Keep one application instance per database; this implementation uses SQLite/libSQL and polling rather than distributed messaging. The database adapter serializes local transactions and supports hosted libSQL over TLS; existing local SQLite data is preserved.

## Owner accounts and verification

Only these addresses are eligible for owner powers:

- `somkene.ebukambonu@millburnacademy.org.uk`
- `kamneto.ebukambonu@millburnacademy.org.uk`

Each owner registers normally, then verifies the address through the email link while signed in to the same account. Merely entering one of these addresses **does not** grant admin powers. Privileged actions check both the verified state and the server-side owner allowlist on every request. Owners receive a verification tick in profiles and chat. Changing an email address or promoting an arbitrary user is not exposed through the UI.

For a free sender without a purchased domain, configure Brevo with `BREVO_API_KEY`, a verified `EMAIL_FROM`, and `APP_URL`. On Render, `APP_URL` can default to the supplied external service URL. Brevo takes priority when its key is configured.

Alternatively, configure HTTPS mail delivery through Resend using `RESEND_API_KEY`, a verified sending address in `EMAIL_FROM`, and the public `APP_URL`. The environment draft declares these requirements; add the key securely in environment settings. The API uses `api.resend.com` and ordinary TLS verification. Actual external delivery is untested until a provider key and verified sender are supplied.

Alternatively, configure an SMTP provider using environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `APP_URL`. `.env.example` contains placeholders only. For a local `.env`, use `node --env-file=.env --watch server.js` for development or `NODE_ENV=production node --env-file=.env server.js` for production. Standard npm commands use already exported environment variables. SMTP uses TLS verification and requires STARTTLS on ports other than 465. Configure the mail provider to send from `SMTP_FROM`, and allow egress to that provider. Never put credentials into Git, chat, or saved scripts. No email service credentials or real passwords are bundled.

Email delivery is **not configured in the initial cloud instance**. Regular accounts and gameplay work, but owner admin access remains locked until verification can be completed. Server-side authorization and admin behavior are tested using an isolated test database; those test accounts never enter the real site database.

## Features

- Games: daily Wordle, Tetris, Snake, 2048, Minesweeper, Memory Match, Tic Tac Toe (computer or local two-player), Connect Four (local two-player), Pong (computer), Breakout, Reaction Time, Trivia Quest, Sudoku.
- Wordle: one deterministic UTC daily puzzle, six guesses, duplicate-letter clues, browser progress persistence, and a curated guess dictionary. It is a custom Wordle-style game. Refresh or reopen the game after midnight for the next puzzle.
- Apps: calculator with parentheses and percentages, world clock, stopwatch with laps, countdown timer, browser notes, unit converter, dice roller, and Pomodoro focus timer.
- Accounts: scrypt password hashes, HttpOnly sessions, email verification, welcome coins, and once-per-day coin claims.
- Chat: shared global room, owner-managed chat rooms, message deletion, room clearing, and server-enforced bans. Messages refresh every 2.5 seconds; settings and room changes refresh every 15 seconds.
- Shop: 4 themes and 6 avatars, server-authoritative pricing, inventory, and equip controls. Coins have no cash value; no real-money payment gateway is included.
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
