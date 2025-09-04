# Deploy

## Frontend (Vercel)
- Project root: `web/`
- Framework preset: Vite
- Build command: `npm run build`
- Output dir: `dist`
- Env vars (Project Settings → Environment Variables):
  - `VITE_WS_URL` → e.g. `wss://YOUR-SERVER/ws`
  - `VITE_API_URL` → e.g. `https://YOUR-SERVER`

## Backend (WebSocket server)
Vercel Node functions do not host stateful WebSocket servers well. Use a Node host:
- Railway: Docker or `npm start` from `server/`
- Fly.io: `fly launch` → expose port 8787
- Render/Heroku: Node service on port 8787

Steps (Railway example)
1. Create new service from repo, root directory `server/`
2. Set env: `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `GOOGLE_CLOUD_API_KEY`, `PORT=8787`
3. Expose public URL, note `https://...` and `wss://...`
4. Update Vercel `VITE_API_URL`/`VITE_WS_URL` to point to this server.

## Domain
- Optionally map a custom domain to both Vercel and the server provider; set CORS origin allowlist on the server.
