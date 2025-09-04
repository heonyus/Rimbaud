# Deployment Guide

## Railway Backend Deployment

### Required Environment Variables

You must set these environment variables in Railway dashboard:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
PORT=8787
```

### How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service (@rimbaud/server)
3. Go to "Variables" tab
4. Click "RAW Editor" or add them one by one:
   - DEEPGRAM_API_KEY
   - ELEVENLABS_API_KEY
   - GOOGLE_CLOUD_API_KEY
   - PORT (optional, defaults to 8787)

5. After adding variables, Railway will automatically redeploy

## Vercel Frontend Deployment

### Required Environment Variables

After your backend is deployed on Railway, set these in Vercel:

```bash
VITE_API_URL=https://your-app.railway.app
VITE_WS_URL=wss://your-app.railway.app
```

### How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add:
   - VITE_API_URL (your Railway backend URL with https://)
   - VITE_WS_URL (your Railway backend URL with wss://)
4. Redeploy your application

## Important Notes

- The backend MUST be deployed and running before the frontend can work
- All API keys are required for the server to start
- Use dummy values for testing if you don't have real API keys yet
- WebSocket URL should use `wss://` for production (secure WebSocket)