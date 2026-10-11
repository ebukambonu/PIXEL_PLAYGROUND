# Deploy the full site on Koyeb

1. Sign in at https://app.koyeb.com/ and connect GitHub.
2. Create a Web Service from `ebukambonu/PIXEL_PLAYGROUND`, branch `main`.
3. Choose the buildpack builder (Node.js). The repository pins Node 24.
4. Set the build command to `npm ci --no-audit --no-fund && npm run build` and the run command to `npm start`.
5. Select the **Free** instance explicitly, in a supported region. If no Free instance is offered, stop rather than choosing a paid instance.
6. Expose HTTP port `3000`, route `/`, and use `/api/bootstrap` for an HTTP health check.
7. Add environment variables securely in Koyeb:

| Variable | Value |
| --- | --- |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `REQUIRE_REMOTE_DATABASE` | `true` |
| `TURSO_DATABASE_URL` | Your existing Turso database URL |
| `TURSO_AUTH_TOKEN` | Your existing private Turso token |

8. Deploy and open the assigned `.koyeb.app` address. Set `APP_URL` to that full HTTPS address and redeploy.
9. For email verification, also configure your existing `BREVO_API_KEY` and verified `EMAIL_FROM` (or the supported Resend configuration). Never paste keys into chat or commit them to GitHub.

Reuse the exact same Turso database used by Render to retain accounts, chat, purchases and settings. A different database starts a separate site. Local SQLite files on Render do not migrate automatically. Once the new site works, stop the old service to avoid running both unnecessarily.

Check sign-in, chat in two browser sessions, daily Wordle, purchases, and administration. Redeploy and confirm records remain. Then replace the Render URL in your Google Sites iframe with the new Koyeb URL. Embedded login can still be affected by browser cookie restrictions; open the website directly for accounts when needed.

Koyeb's Free instance has 512 MB RAM, 0.1 vCPU, and 2 GB disk, with one Free instance per organization. Free instances have regional, idle-sleep and other limitations; consult the current [official instance documentation](https://www.koyeb.com/docs/reference/instances). Free availability and signup requirements can change. School access is determined by the school's filtering policy.
