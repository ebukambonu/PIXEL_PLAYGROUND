# Google Sites with a Supabase backend (no Vercel required)

Google Sites displays the app. Supabase Storage serves the game's JavaScript, CSS and fonts, Supabase Edge Functions run the protected API, and Supabase PostgreSQL stores the data. Sign-up and login use a username and password; no email is required. Admin usernames are **Somkene** and **Kamneto**.

## Your configured project

The Google Sites embed in `deployment/GOOGLE_SITES_APP.html` is built for `https://vbidopmddmrgweqjktut.supabase.co`. The project reference is `vbidopmddmrgweqjktut`. The backend function and Storage assets were deployed and the public bootstrap endpoint verified on 11 October 2026. Existing records were migrated from the original Turso database in one checked PostgreSQL transaction; the source was retained and a private backup saved outside this repository. The older source had no rate_limits table, so that new table starts empty. Avoid further writes through the previous host: changes made there after migration are not copied automatically. Copying the HTML into Google Sites and publishing that page is still required.

## 1. Create a free project

1. Sign in at https://supabase.com/ with GitHub and choose **New project**.
2. Choose a Free organization/plan, name the project **Pixel Playground**, select a region, and save a strong database password privately.
3. Once ready, find the **Project URL** under project settings/API or the Connect dialog. It looks like `https://YOUR_PROJECT.supabase.co`. This URL and the project reference are public; passwords and service-role keys are private.

## 2. Preserve your current records first

Do this before deploying the new function: its startup seeds rooms and settings, while migration deliberately requires an empty destination.

1. Stop old apps using the source database so no new messages or purchases are written during migration. Keep the source database.
2. On a trusted machine with this repository and Node.js 24, run `npm ci`.
3. Supply `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for the original source and `SUPABASE_DB_URL` for the new destination. Get the destination URI from **Connect → Transaction pooler** (normally port 6543), replacing the password placeholder and URL-encoding special characters. A project URL or API key is not a database URI.
4. Set `MIGRATION_BACKUP_PATH` to a private new backup path outside the repository. The default is a timestamped file in `/tmp`; move it to secure durable storage afterward.
5. Run `npm run migrate:supabase`, or `node --env-file=.env scripts/migrate-supabase.js` if using a local ignored environment file. For a local SQLite source, use `MIGRATION_SQLITE_PATH` instead of Turso variables.

The tool backs up and copies all thirteen tables, preserving IDs, password hashes, coins, inventories, sessions, messages, rooms, settings, scores, bans and history. Copies commit as one destination transaction, verify counts, and reseed ID sequences. It refuses nonempty destinations and never deletes source records. Verified legacy owners retain their admin role; the existing Somkene exception is retained. Legacy owner usernames become Somkene/Kamneto when those names do not conflict with another player. A name conflict stops migration rather than replacing that player. Existing admin roles in an upgraded source are authoritative.

If migration fails, do not switch hosts. The data copy rolls back, although empty schema definitions can remain. Keep the source and private backup. Do not erase old data to resolve an error without reviewing it.

## 3. Deploy the Supabase Edge Function

Use the Supabase CLI on a trusted machine. Sign in with `supabase login`, then deploy from the repository root:

```sh
supabase functions deploy pixel-playground --project-ref vbidopmddmrgweqjktut --no-verify-jwt
```

The function uses its own hashed passwords, expiring sessions and database admin roles; protected API operations still require sign-in. The gateway JWT setting is disabled because those sessions are not Supabase Auth JWTs.

In Supabase **Edge Functions → Secrets**, configure:

| Secret                  | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `PIXEL_DATABASE_URL`    | Your private PostgreSQL transaction-pooler URI                                 |

The database adapter enforces TLS certificate verification. If a provider-specific certificate is required, add its official PEM certificate as `SUPABASE_CA_CERT`; do not disable verification. The tables are in the private `pixel_playground` schema, not the public Data API schema. No database password or service-role key belongs in frontend code.

Do not use names starting with `SUPABASE_` for custom Edge secrets; Supabase reserves that prefix. The CLI migration uses `SUPABASE_DB_URL` locally; the deployed function uses `PIXEL_DATABASE_URL`.

Visit `https://YOUR_PROJECT.supabase.co/functions/v1/pixel-playground/api/bootstrap`. It should return JSON with rooms and 154 catalog entries (including 12 packs and 120 new avatars). Check function logs if it returns 503; never publish logs with connection secrets.

## 4. Build and publish the Google Sites app

Set these securely on the trusted build machine:

- `VITE_API_BASE_URL=https://YOUR_PROJECT.supabase.co/functions/v1/pixel-playground` (public endpoint, safe in frontend code).
- `SUPABASE_URL=https://YOUR_PROJECT.supabase.co` (public project URL).
- `SUPABASE_SERVICE_ROLE_KEY` (private legacy service-role key, used only by the asset upload script; never put it in the Google Sites HTML).

Run:

```sh
npm run build:google-sites
npm run publish:google-sites
```

The upload script creates a dedicated public `pixel-assets` storage bucket and uploads only built JavaScript, CSS and fonts. Accounts and database backups are never uploaded to that bucket. The service-role key is used only on the trusted machine, never included in the HTML or JavaScript.

Open `dist-google-sites/GOOGLE_SITES_APP.html` and copy its contents into **Google Sites → Insert → Embed → Embed code**. Choose **Next → Insert**, resize to the page width and about 950 pixels high, then **Publish**. This is the real app, rather than an iframe around Vercel. The small embed loads assets directly from Supabase Storage.

## 5. Accounts and validation

Players register a username and a password of at least ten characters. Registration with Somkene or Kamneto grants admin access automatically, without a setup code. Register both names promptly: anyone can claim an unused admin name. Existing admin accounts retain their passwords and permissions. Claimed email addresses and supplied role fields do not grant admin access.

Check sign-in, chat from two sessions, purchases and theme/avatar equipment, Wordle, Hangman, 15 Puzzle and admin announcements/bans. Google Sites sign-in uses explicit bearer sessions, so it does not depend on third-party cookies. Session storage is confined to the embedded browser origin; if that storage is unavailable, the session lasts until the page reloads. Keep passwords safe: email-based recovery is not provided for username-only accounts.

Supabase's free database, storage and Edge Functions have usage limits, and free projects can pause when inactive. Check current https://supabase.com/pricing and keep backups. School network access is determined by its filtering policy. Local Deno/PostgreSQL checks do not prove live deployment, Supabase connectivity or Google Sites rendering. Those require your actual project and secure credentials.

## Games and player roles

The app includes 19 games. Neon Citadel, Dungeon Depths, Starfighter and Gem Quest support saved leaderboard scores. Each game includes its own controls and instructions, including touch controls.

In the admin panel, open Players, edit a player, choose a Display role and save. Roles include Gamer, Supporter, Dev, Admin, OG, Owner and OP. Admin, Dev and Owner confer admin-panel access and can assign roles; the other roles affect names and badges only. Owner names use a rainbow gradient. Somkene and Kamneto are protected founders and cannot be banned. Role changes are validated and audited by the API. Existing data is preserved when the new display_role column is added. Refresh the page after your role changes.

## Avatar pack market

The market has 12 themed packs with 120 new collectible avatars (134 avatars including the legacy shop). Rarities: Uncommon, Rare, Epic, Legendary, Mystical and OP. Default percentages are 60 / 25 / 10 / 4 / 0.9 / 0.1. Each opening is an independent draw: there is no pity meter, stacking, or ownership-based adjustment. All draws and coin changes happen in a server-side transaction. Duplicate avatars refund 25% of the pack price rounded down. Retrying a request ID replays its stored result instead of charging again.

Admins can edit probabilities under Games & shop → Pack opening chances. Each pack must total exactly 100%, with at most two decimal places. Price, name, description and visibility are edited in Shop catalog. A pack cannot remain active if a rarity with positive odds has no visible avatar. OP avatar draws grant the OP role; Admin/Dev/Owner and protected founder permissions are preserved, with an additional earned OP badge.

The release adds pack_openings and users.earned_op without deleting existing records. Older migrations without pack_openings treat it as empty. Include src/avatarPacks.js and src/passwords.js with the shared modules when deploying the Edge Function. Replace the Google Sites embed with deployment/GOOGLE_SITES_APP.html after publishing assets.
