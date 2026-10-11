# Deploy the full Pixel Playground on Vercel

The repository now builds a static Vite frontend and a Node.js Vercel Function for `/api/*`. Accounts, rooms, chat, shop transactions, scores and administration continue to use Turso. Chat uses polling; no permanent server process is required. Rate limits are stored in the database and enforced across function instances.

## Connect and configure

1. Sign in at https://vercel.com/ with GitHub, select **Add New → Project**, and import `ebukambonu/PIXEL_PLAYGROUND`.
2. Keep the root directory as the repository root and choose **Vite**. The supplied `vercel.json` sets `npm run build`, output directory `dist`, API routing, and a 60-second function timeout. Use Node.js **24.x** in project settings.
3. In **Environment Variables**, add these for **Production**:

| Variable             | Value                                         |
| -------------------- | --------------------------------------------- |
| `TURSO_DATABASE_URL` | Your existing Turso database URL              |
| `TURSO_AUTH_TOKEN`   | Your existing private Turso application token |
| `NODE_ENV`           | `production`                                  |

Reuse the database from Render/Koyeb to keep the same accounts, messages and purchases. Vercel refuses to start the backend without a remote database, regardless of `REQUIRE_REMOTE_DATABASE`. Never put the token in GitHub or chat.

4. Click **Deploy**. Open the assigned HTTPS `.vercel.app` address. Set `APP_URL` to that full address under project environment variables and **Redeploy**. The app otherwise uses `VERCEL_PROJECT_PRODUCTION_URL` when Vercel supplies it; an explicit `APP_URL` also supports custom domains.
5. For verification email, set your existing `BREVO_API_KEY` and verified sender `EMAIL_FROM`, or `RESEND_API_KEY` and its verified sender. Redeploy after changing variables. Links are sent and awaited within the function request.

The existing Somkene admin exception remains: `somkene.ebukambonu@millburnacademy.org.uk` gets admin access without verifying its email. Kamneto still requires email verification.

Use a separate Turso database for Preview environments, or leave preview database variables unset so their API fails safely. Giving a preview deployment your production credentials allows it to modify production accounts and data.

## Check the deployment

- `/api/bootstrap` should return JSON with rooms and 22 shop items.
- Register or sign in, claim daily coins, buy and equip a theme/avatar.
- Send chat messages from two signed-in browser sessions and check they appear in both.
- Play Wordle, Hangman and 15 Puzzle; check saved scores when signed in.
- Open admin controls, change an announcement, and check the change in another session.
- Redeploy and check that accounts, messages, purchases and settings remain.

For Google Sites, replace the iframe source with your actual Vercel HTTPS URL. Neither the frontend nor API adds framing restrictions. Browser third-party-cookie rules may still require opening the full website directly for sign-in and administration. School filtering determines whether the host is accessible.

## Limits and troubleshooting

Vercel Hobby has usage and eligibility limits, including personal/non-commercial usage requirements. Turso and the email provider have independent free-plan limits. This deployment has not been verified on a real Vercel account until you connect GitHub, configure credentials and deploy.

If the UI loads but the API reports unavailable, check **Functions/Logs** and the Turso variables, then redeploy. Do not publish logs containing keys. If you get a 404 from `/api/bootstrap`, verify that `vercel.json` and `api/index.js` are present on the deployed branch and that the project root is correct. Email failures require checking the provider account, sender and `APP_URL`.

References: [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js), [project configuration](https://vercel.com/docs/project-configuration), [Hobby plan](https://vercel.com/docs/plans/hobby).
