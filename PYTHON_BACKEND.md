# ISOMO Python backend

This repository remains the live React + TypeScript PWA. The Python backend is added as a Vercel Python serverless function at `/api/python`; it does not replace the existing frontend or existing TypeScript API routes.

## Local development

1. Install Python 3.11 or newer.
2. Run the existing frontend with `npm install` and `npm run dev`.
3. Vercel's local CLI can run the Python function together with the frontend: `npx vercel dev`.
4. Set the same Supabase URL and anon key in your local environment that the existing app uses. Do not commit secrets.

## API routes

- `GET /api/python?action=health` — public service health check.
- `GET /api/python?action=vocabulary` — authenticated vocabulary list.
- `POST /api/python` with `{"action":"study_plan","weakestArea":"Writing","dailyMinutes":45,"targetScore":120}` — returns a seven-day plan.
- `POST /api/python` with `{"action":"analyse_response","area":"Writing","response":"Your practice response..." }` — returns a basic writing checklist.

Authenticated routes require `Authorization: Bearer <Supabase access token>`. The function verifies the token with Supabase Auth. It never accepts a service-role key from the browser and does not expose secrets.

## Call it from the existing React app

Use the already configured `api` helper from `src/lib.ts`:

```ts
const { data } = await api.post('/api/python', {
  action: 'study_plan',
  weakestArea: 'Writing',
  dailyMinutes: 45,
  targetScore: 120,
});
```

For vocabulary, use `fetch('/api/python?action=vocabulary', { headers: { Authorization: 'Bearer ' + session.access_token } })` after obtaining the current Supabase session.

## Deploy

Commit and push changes to the connected GitHub `main` branch. Vercel's existing Git integration will build and deploy the frontend and Python function together to the current project/domain. No separate app or paid Python hosting service is required. If the Vercel project does not have the Supabase URL and anon key available to server functions, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel Project Settings → Environment Variables using the same public project URL and anon key already used by the app. Never use the Supabase service-role key here.
