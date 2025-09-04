export type ClientHello = { type: 'hello'; lang: 'ko' | 'en' | 'ja'; voiceId?: string }
export type ClientAudio = { type: 'audio'; sampleRate: number; pcm16: string }
export type ClientControl = { type: 'control'; action: 'stop-tts' }
export type ClientPing = { type: 'ping'; t: number }
export type ClientMessage = ClientHello | ClientAudio | ClientControl | ClientPing

export type ServerReady = { type: 'ready' }
export type ServerTranscript = {
  type: 'transcript'
  dir: 'in' | 'out'
  partial: boolean
  text: string
  srcLang: 'ko' | 'en' | 'ja'
  dstLang: 'ko' | 'en' | 'ja'
}
export type ServerTTS = { type: 'tts_audio'; sampleRate: number; pcm16: string }
export type ServerPong = { type: 'pong'; t: number }
export type ServerError = { type: 'error'; code: string; message: string }
export type ServerMessage = ServerReady | ServerTranscript | ServerTTS | ServerPong | ServerError

