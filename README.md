# Exchange Year Buddy (Filo)

Minimal chat app for exchange students: talk in the target language, get real survival tips.

## Stack
- Cloudflare Pages (static site + Pages Functions)
- /functions/api/chat.js calls OpenAI; API key stays server-side
- /public/knowledge/filo.json holds persona, scenarios, slang, tips

## Setup
1) Push this repo to GitHub.
2) Cloudflare Pages → Create new project → Connect repo.
3) Build command: (none). Output directory: `public`.
4) Add **Environment Variable**: `OPENAI_API_KEY` (Production).
5) Deploy. The function is auto-exposed at `/api/chat`.

## Local dev
- Use `wrangler pages dev ./public` to run Pages + Functions locally (optional).

## Editing knowledge
- Edit `/public/knowledge/filo.json` anytime. Changes reflect on next request.

## Notes
- Do not put the API key in the frontend.
- If you want voice later, add Web Speech API in the browser, or a Realtime API proxy.
