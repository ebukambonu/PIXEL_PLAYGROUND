# Full app in Google Sites

`GOOGLE_SITES.html` is a separate Google Sites embed wrapper around the live Vercel app. It uses the same games, apps, accounts, shared chat, shop and admin panels, with the same Turso database. It does not create a second user database or deploy a backend inside Google Sites.

1. Open [the HTML file on GitHub](https://github.com/ebukambonu/PIXEL_PLAYGROUND/blob/main/deployment/GOOGLE_SITES.html).
2. Use **Raw** to see the plain HTML, then copy the entire file.
3. In Google Sites, choose **Insert → Embed → Embed code**.
4. Paste the HTML, then choose **Next → Insert**.
5. Resize the embed to the full page width and about 950 pixels high, then **Publish**.

The Open full site button provides direct access for browsers that block third-party login cookies. Neither this wrapper nor Google Sites can override browser cookie restrictions or a school network block.

The Vercel backend must be working for the app to load and for shared features to work. At preparation, `https://pixel-playground-eta.vercel.app/api/bootstrap` returned 503. Configure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for Production in Vercel and redeploy; follow `VERCEL.md` for deployment and email settings. If it still returns 503, inspect Vercel function logs to identify the initialization error. Check `/api/bootstrap` returns successful JSON before embedding. Do not share credentials in logs or chat.

If you change hosts, update both the iframe `src` and the Open full site link in `GOOGLE_SITES.html`. Updating this repository file does not automatically replace HTML already pasted into Google Sites; paste the updated file again and publish.
