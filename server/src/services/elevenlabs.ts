type Lang = 'ko' | 'en' | 'ja'

type Opts = { apiKey: string; voiceId?: string; language: Lang }

export class ElevenLabsTTS {
  private apiKey: string
  private voiceId?: string
  private language: Lang
  private audioCb: (buf: Buffer) => void = () => {}
  private aborter?: AbortController

  constructor(opts: Opts) {
    this.apiKey = opts.apiKey
    this.voiceId = opts.voiceId
    this.language = opts.language
  }

  onAudio(cb: (buf: Buffer) => void) { this.audioCb = cb }

  async speakStream(text: string) {
    await this.startStream(text)
  }

  async speakCommit(text: string) {
    await this.startStream(text)
  }

  stop() {
    try { this.aborter?.abort() } catch {}
  }

  close() {
    this.stop()
  }

  private async startStream(text: string) {
    if (!this.voiceId) return
    this.stop()
    this.aborter = new AbortController()
    const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`)
    url.searchParams.set('optimize_streaming_latency', '3')
    url.searchParams.set('output_format', 'pcm_16000')
    const body = {
      text,
      model_id: 'eleven_multilingual_v2'
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: this.aborter.signal
    })
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength) this.audioCb(Buffer.from(value))
    }
  }
}

