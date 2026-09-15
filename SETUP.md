# Family Hub setup

## 1. GitHub Pages
1. Create a new GitHub repository named `family-hub`.
2. Upload all files in this folder.
3. Open **Settings → Pages**.
4. Under Build and deployment choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
5. Save. GitHub will provide the site address.

## 2. Change the starter PIN
The local-demo PIN is `2468`. Before using real data, do not rely on this local PIN as security.

## 3. Supabase sync (recommended before real family data)
The safe architecture is: GitHub Pages → Supabase Edge Function → private Supabase table. The shared PIN is checked by the Edge Function so the database does not need to be publicly readable.

Create a free Supabase project. In SQL Editor create:

```sql
create table family_state (
  id text primary key default 'main',
  payload jsonb not null,
  updated_at timestamptz default now()
);
alter table family_state enable row level security;
```

Do **not** add a public select/update policy. The Edge Function uses the server-side service role.

Create an Edge Function named `family-hub-api` using the included `supabase/functions/family-hub-api/index.ts`. Add a function secret named `FAMILY_PIN_HASH` containing a SHA-256 hash of the PIN. Deploy the function.

Then add the Supabase project URL and public anon key to the web app configuration. The anon key is designed to be public; the service-role key and PIN hash must never go in GitHub.

The current starter intentionally defaults to local browser storage so it works immediately. The next development pass can wire `app.js` to the deployed Edge Function once the project URL is known.

## 4. Install on iPhone/iPad
Open the GitHub Pages site in Safari → Share → **Add to Home Screen**.

## Weather
Weather uses Open-Meteo and requires no API key. Las Vegas and Flagstaff are preconfigured.
