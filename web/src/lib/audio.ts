export function floatTo16BitPCM(float32: Float32Array) {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

export function encodeBase64PCM(int16: Int16Array) {
  const buf = new Uint8Array(int16.buffer)
  let bin = ''
  for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i])
  return btoa(bin)
}

export function base64ToPCM16(b64: string): Int16Array {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

export function resampleLinear(input: Float32Array, from: number, to: number) {
  if (from === to) return input
  const ratio = to / from
  const outLength = Math.round(input.length * ratio)
  const out = new Float32Array(outLength)
  let pos = 0
  for (let i = 0; i < outLength; i++) {
    const idx = pos | 0
    const frac = pos - idx
    const v0 = input[idx] || 0
    const v1 = input[idx + 1] || v0
    out[i] = v0 + (v1 - v0) * frac
    pos += 1 / ratio
  }
  return out
}

export class AudioPlayer {
  private ctx: AudioContext
  private t = 0
  constructor(ctx: AudioContext) { this.ctx = ctx }
  playPCM16Mono(pcm: Int16Array, sampleRate: number) {
    const f32 = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000
    const buf = this.ctx.createBuffer(1, f32.length, sampleRate)
    buf.getChannelData(0).set(f32)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const now = this.ctx.currentTime
    this.t = Math.max(this.t, now)
    src.connect(this.ctx.destination)
    src.start(this.t)
    this.t += buf.duration
  }
}

