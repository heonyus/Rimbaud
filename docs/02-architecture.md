# Architecture

## Overview
- App‑to‑app transport via WebSocket audio bridge.
- Two symmetric pipelines per call: A→B and B→A.
- Each pipeline: VAD → streaming STT → MT → streaming TTS → playback.

## Audio
- Input: PCM16 LE, 16 kHz, 20–40 ms frames, base64 in WS frames.
- Output: PCM16 LE, 16 kHz, same framing.

## Sessions
- Session `id` identifies a pair of peers: roles `A` and `B`.
- Each peer opens `ws /ws/session/:id/:role` and sends a `hello` message.
- Server holds per‑session state: langs, voices, stream handles, backpressure.

## Flow
1. Client captures mic, resamples to 16 kHz PCM16, sends `audio` frames.
2. Server pushes audio to STT stream; partials and finals are emitted.
3. Partials are translated and sent to TTS as chunks; audio is streamed to the other role.
4. Finals correct transcripts and, if needed, issue replacement TTS tail.
5. If opposite side starts speaking, in‑progress TTS is stopped (barge‑in).

## Reliability
- Heartbeats and idle timeouts.
- Graceful reconnection with brief buffer.
- Backpressure: drop oldest audio if queue exceeds threshold.

## Security
- API keys from environment only.
- CORS and origin checks for WS.
- Voice cloning requires prior consent and explicit enrollment.

