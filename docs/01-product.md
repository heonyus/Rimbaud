# Rimbaud — Real‑Time Cross‑Language Call With Voice Cloning

- Goal: Enable two people speaking different languages to call app‑to‑app, each hearing the other in their own language with the other person’s cloned voice.
- Target pairs: ko↔en, ko↔ja.
- MVP latency budget: 700–1500 ms end‑to‑end for typical phrases.
- Core features:
  - Realtime speech capture, incremental transcription, translation, and streaming TTS.
  - Barge‑in handling and playback interruption.
  - Voice enrollment and selection per user.
  - Session management for A↔B pipelines.
- Non‑goals for MVP:
  - PSTN/SIP.
  - Multi‑party conferencing.

## Principles
- Stream early, correct later: start TTS on stable partials; revise on finals.
- Keep payloads small: 16 kHz PCM16 frames, 20–40 ms.
- Privacy by default: keys in local env, minimal logging, explicit consent for cloning.

## Success Criteria
- Natural, intelligible output in ko/en/ja with minimal artifacts.
- Stable partials and limited rollbacks.
- UI that makes state obvious and feels playful and modern.

