import { WebSocket } from 'ws'

type Lang = 'ko' | 'en' | 'ja'

type Opts = { apiKey: string; language: Lang }

export class DeepgramStream {
  private ws?: WebSocket
  private partialCb: (text: string) => void = () => {}
  private finalCb: (text: string) => void = () => {}
  private ready = false
  private queue: Buffer[] = []
  private opts: Opts

  constructor(opts: Opts) {
    this.opts = opts
    const url = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&model=nova-2&language=${opts.language}&smart_format=true&punctuate=true&interim_results=true`
    const ws = new WebSocket(url, { headers: { Authorization: `Token ${opts.apiKey}` } })
    this.ws = ws
    ws.on('open', () => {
      this.ready = true
      for (const b of this.queue) ws.send(b)
      this.queue = []
    })
    ws.on('message', (d) => {
      try {
        const s = d.toString()
        const j = JSON.parse(s)
        const alt = j?.channel?.alternatives?.[0]
        const txt = alt?.transcript as string | undefined
        if (!txt) return
        if (j?.is_final) this.finalCb(txt)
        else this.partialCb(txt)
      } catch {}
    })
  }

  onPartial(cb: (text: string) => void) { this.partialCb = cb }
  onFinal(cb: (text: string) => void) { this.finalCb = cb }

  push(pcm16: Buffer) {
    if (!this.ws || this.ws.readyState !== this.ws.OPEN) {
      this.queue.push(pcm16)
      return
    }
    this.ws.send(pcm16)
  }

  close() {
    try { this.ws?.close() } catch {}
  }
}

