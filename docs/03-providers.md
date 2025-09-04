# Providers

## Chosen for MVP
- STT: Deepgram Realtime
  - Low latency, stable partials, strong ko/ja quality.
- MT: Google Cloud Translate
  - Reliable for ko↔en/ja, fast responses, simple REST.
- TTS + Cloning: ElevenLabs Streaming TTS
  - High naturalness, multilingual, fast startup, straightforward enrollment.

## Alternatives
- All‑Azure: Speech STT + Translator + Custom Neural Voice.
- Self‑hosted: Coqui XTTS v2 for TTS/cloning; requires GPU and ops.

## Notes
- ko/ja STT model choice matters; use latest low‑latency models.
- Use streaming APIs for partials; start TTS before sentence end.
- For cloning, enroll with 30–120 s clean speech per user.

