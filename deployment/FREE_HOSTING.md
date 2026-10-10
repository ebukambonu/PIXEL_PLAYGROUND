# Put Pixel Playground online without buying a domain

Use **Render Free** for the Node website and **Turso Free** for the SQLite-compatible database. Keep both accounts on their free plans and do not enable paid overages. You can use the HTTPS address Render assigns, ending in **.onrender.com**. The exact available hostname is assigned at deployment; the example below is not a reserved domain.

An individually registered domain such as `pixelplayground.com` normally costs money. You do not need to buy one for this setup. A Render address is a subdomain, not ownership of `onrender.com`.

## 1. Put these project files on GitHub

The project code and `render.yaml` must exist in `ebukambonu/PIXEL_PLAYGROUND` on `main` before Render can build it. The original empty `code` file alone cannot run the website.

The supplied deployment ZIP contains the source, lockfile, tests, and configuration. **Unzip it first**, then use GitHub's **Add file → Upload files** to upload its contents to the repository root, keeping `src`, `public`, `tests`, and `deployment` as folders. Commit the upload. Alternatively, use your usual Git client to commit and push the project files.

Never upload `.env`, `data`, `node_modules`, tokens, or passwords. `.env.example` contains placeholders and is safe to include.

## 2. Create the free database

1. Sign up at [Turso](https://turso.tech/) and choose the free plan.
2. Create a database called `pixel-playground` in a location close to your intended Render service region.
3. Obtain the database URL and an application authentication token. The URL looks like `libsql://your-database-your-account.turso.io`.
4. Keep the token private. You will enter it in Render environment settings, **not in chat or GitHub**.

The app creates its tables on its first successful connection. Local development continues to use `data/pixel.db` when no Turso URL is configured. Pointing at a new Turso database starts a new site database; it does not automatically upload existing local users or chat history. If the local site already has real data, back it up and arrange an explicit migration before switching.

## 3. Create the free web service

1. Sign up at [Render](https://render.com/) and connect the GitHub repository.
2. Use **New → Blueprint** to load `render.yaml`. Check that the web service uses the **Free** plan. No paid disk or paid database is declared.
3. Provide the requested values securely:
   - `TURSO_DATABASE_URL`: the URL from Turso.
   - `TURSO_AUTH_TOKEN`: the application token from Turso.
4. Deploy the service and open its assigned HTTPS address.

If using **New → Web Service** instead, choose the Node runtime and **Free** plan. Use:

| Setting                   | Value                                          |
| ------------------------- | ---------------------------------------------- |
| Build command             | `npm ci --no-audit --no-fund && npm run build` |
| Start command             | `npm start`                                    |
| Health check              | `/api/bootstrap`                               |
| `NODE_VERSION`            | `24.19.0`                                      |
| `NODE_ENV`                | `production`                                   |
| `REQUIRE_REMOTE_DATABASE` | `true`                                         |
| `TURSO_DATABASE_URL`      | Your database URL                              |
| `TURSO_AUTH_TOKEN`        | Your private database token                    |

`REQUIRE_REMOTE_DATABASE=true` makes startup fail clearly if the remote URL is missing, so the website cannot silently store important accounts on Render's temporary disk. `APP_URL` defaults to Render's `RENDER_EXTERNAL_URL`. If you later use a custom domain, set `APP_URL` to that public HTTPS address.

Render will run the site; publishing the Codex cloud environment is a separate action and does not create the public website. Credentials in Codex do not automatically transfer to Render.

## 4. Enable free verification email

Use an HTTPS email API because Render Free blocks common outbound SMTP ports. **Brevo** provides a free-plan option that can verify a sender email address without buying a domain; it may rewrite the From address when the sender domain is unauthenticated. Review its account requirements and current limits when signing up.

1. Create a free [Brevo](https://www.brevo.com/) account and enable transactional email if the account requires it.
2. In **Senders**, add an email address you control and complete its verification code. Do not claim ownership of the school's email domain or attempt to configure its DNS without authorization.
3. Create a Brevo API key.
4. In Render environment settings, add `BREVO_API_KEY` and set `EMAIL_FROM` to that verified sender address. Never put the key in chat or GitHub.
5. Save/redeploy, register each owner account, and request a verification email. Open the link while signed in to the same account that requested it. Check junk folders as needed.

The account `somkene.ebukambonu@millburnacademy.org.uk` receives admin access immediately, without email verification. This explicit exception does not mark its email verified. Anyone registering that exact address can acquire admin powers.

These other owner addresses still require verification:

- `kamneto.ebukambonu@millburnacademy.org.uk`

Brevo is preferred if both Brevo and Resend keys are present. Resend is still supported, but its test sender restricts recipients; sending to both owners normally requires a verified sending domain. If choosing Brevo, you do not need a Resend key. Real external email delivery remains untested until your provider account, key, sender and public site address are configured.

## 5. Confirm that the public site works

- Register an ordinary account; sign out and sign back in.
- Claim daily coins, buy an item, and equip it.
- Send a message and check it in a second browser session.
- Open daily Wordle and Tetris.
- After email verification, check each owner's admin panel.
- Trigger one Render restart/redeploy and confirm the account, coins, messages, and settings remain present. This is the check that proves your Turso credentials and durable storage are working on the actual host.

The local tests validate the asynchronous database adapter, transactions, and API behavior. They do **not** establish that your future Turso endpoint or Render deployment works; those checks need the accounts and credentials you configure.

## Free-plan limits

Render Free sleeps after 15 minutes without inbound traffic, so reopening the site can involve a cold start. Its filesystem is ephemeral and it has monthly instance-hour and usage limits. Turso Free has storage/read/write limits; requests can be blocked when those are exceeded. These free plans suit a small playground; they do not promise unlimited traffic or uptime. Keep backups of important data.

Official references checked during preparation:

- [Render free service limits](https://render.com/docs/free)
- [Turso plans](https://turso.tech/pricing)
- [Brevo sender verification and address rewriting](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email)
