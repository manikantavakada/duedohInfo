# Duedoh Info

The pre-launch registration site for Duedoh partners (Dudes).

This is a Vite/React frontend only. It uses the production Duedoh API and the
same OTP, profile, tier, availability, verification-document, and payout
endpoints as the Dude mobile app. Registrations write directly into the main
Duedoh database and appear in the existing admin panel for approval.

After approval, partners sign in to the Dude app with the same email address.
No accounts, tables, or approval pipeline are duplicated in this project.

## Local run

```bash
cd frontend
npm install
npm run dev
```

The Vite proxy sends `/v1` requests to `https://duedoh-api.azurewebsites.net`.

## Vercel

Import this repository in Vercel and set the project root directory to
`frontend`.

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Node: `20.x` or later

`frontend/vercel.json` proxies `/v1/*` to the Duedoh API and rewrites client
routes to `index.html`, so no separate registration backend or browser CORS
configuration is needed.

To point a preview at a different API, set `VITE_API_BASE` in Vercel.
