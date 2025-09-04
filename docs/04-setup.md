# Setup

## Requirements
- Node.js 20+
- pnpm 9+ (or npm)

## Environment
Create `.env.local` at repo root with:

```
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
GOOGLE_CLOUD_API_KEY=...
VITE_WS_URL=ws://localhost:8787
```

## Install
Preferred (Corepack + pnpm):
```
node -v
corepack enable
corepack prepare pnpm@9 --activate
pnpm -v
pnpm -w install
```

Fallback (npm workspaces):
```
npm install --workspaces
```

If `corepack enable` fails on Windows (EPERM), either:
- Run PowerShell as Administrator, or
- Install pnpm globally: `npm i -g pnpm`, then use `pnpm -w install`.

## Dev
Terminal 1:
```
pnpm -w --filter @rimbaud/server dev
# or with npm
npm run -w @rimbaud/server dev
```
Terminal 2:
```
pnpm -w --filter @rimbaud/web dev
# or with npm
npm run -w @rimbaud/web dev
```

Server at `http://localhost:8787`.
Web at `http://localhost:5173`.

## Voice Enrollment
- Option A: Paste an existing ElevenLabs `voiceId` in the app’s Voice panel and Save.
- Option B: Upload 30–120s of clean speech in the Voice panel → server will create a voice via ElevenLabs and return a `voiceId`.
- Use Preview to hear a short sample and validate the voice.

## Deploy
- Frontend: deploy `web/` to Vercel (project root = `web`, build = `vite build`, output = `dist`).
- Server (WebSocket required): deploy `server/` to a Node host (Railway/Fly/Render/VM). Set CORS and point `VITE_WS_URL`/`VITE_API_URL` on Vercel to the server URL.
