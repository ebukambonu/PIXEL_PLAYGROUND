# Current Google Sites deployment

The requested setup now uses **Google Sites + Supabase**, with no Vercel dependency. Follow [SUPABASE.md](SUPABASE.md) to migrate existing data, deploy the Edge Function and publish assets.

`npm run build:google-sites` generates `dist-google-sites/GOOGLE_SITES_APP.html` for the public Supabase project endpoint you configure. Paste it into Google Sites **Insert → Embed → Embed code** after uploading the built assets with `npm run publish:google-sites`.

The older `GOOGLE_SITES.html` file is a legacy Vercel iframe wrapper. Use the generated app HTML for the new Supabase deployment. It supports all games, tools, shared chat, shop and account administration. Sign-up and login use usernames and passwords, with Somkene and Kamneto reserved as admin names.

The project-specific embed is saved as [`GOOGLE_SITES_APP.html`](GOOGLE_SITES_APP.html). Deploy the function and upload the built assets using the Supabase guide before embedding it.
