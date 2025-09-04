# API

## WebSocket: `/ws/session/:id/:role`
- Roles: `A` or `B`.
- Subprotocol: `rimbaud.v1` (optional).

### Client → Server frames
```
{ "type": "hello", "lang": "ko|en|ja", "voiceId": "..." }
{ "type": "audio", "sampleRate": 16000, "pcm16": "<base64>" }
{ "type": "control", "action": "stop-tts" }
{ "type": "ping", "t": 1234567890 }
```

### Server → Client frames
```
{ "type": "ready" }
{ "type": "transcript", "dir": "in|out", "partial": true, "text": "...", "srcLang": "ko", "dstLang": "en" }
{ "type": "tts_audio", "sampleRate": 16000, "pcm16": "<base64>" }
{ "type": "pong", "t": 1234567890 }
{ "type": "error", "code": "...", "message": "..." }
```

## REST
### `GET /api/health`
200 `{ status: "ok" }`

### `POST /api/sessions`
Body `{ aLang, bLang, aVoiceId?, bVoiceId? }`
200 `{ id }`

### `POST /api/voices`
Multipart body: `name`, `file`
200 `{ voiceId }`

### `GET /api/voices/validate?voiceId=...`
200 `{ ok: true, voiceId }` or `{ ok: false, error }`

### `POST /api/voices/preview`
JSON `{ voiceId, text, language }`
200 `{ sampleRate: 16000, pcm16: "<base64>" }`
