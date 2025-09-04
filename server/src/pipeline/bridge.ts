import { DeepgramStream } from '../services/deepgram.js'
import { translateText } from '../services/google.js'
import { ElevenLabsTTS } from '../services/elevenlabs.js'

type Lang = 'ko' | 'en' | 'ja'

export type PipelineConfig = {
  srcLang: Lang
  dstLang: Lang
  voiceId?: string
  deepgramKey: string
  elevenKey: string
  googleKey: string
}

export class DirectionalPipeline {
  private stt: DeepgramStream
  private tts: ElevenLabsTTS
  private sendAudio: (pcm16: Buffer) => void = () => {}
  private sendTranscript: (partial: boolean, text: string) => void = () => {}
  private dstLang: Lang
  private srcLang: Lang

  constructor(cfg: PipelineConfig) {
    this.srcLang = cfg.srcLang
    this.dstLang = cfg.dstLang
    this.stt = new DeepgramStream({ apiKey: cfg.deepgramKey, language: cfg.srcLang })
    this.tts = new ElevenLabsTTS({ apiKey: cfg.elevenKey, voiceId: cfg.voiceId, language: cfg.dstLang })

    this.stt.onPartial(async (text) => {
      const t = await translateText({ apiKey: cfg.googleKey, text, source: this.srcLang, target: this.dstLang })
      this.sendTranscript(true, t)
      this.tts.speakStream(t)
    })
    this.stt.onFinal(async (text) => {
      const t = await translateText({ apiKey: cfg.googleKey, text, source: this.srcLang, target: this.dstLang })
      this.sendTranscript(false, t)
      this.tts.speakCommit(t)
    })
    this.tts.onAudio((buf) => this.sendAudio(buf))
  }

  setSenders(sendAudio: (pcm16: Buffer) => void, sendTranscript: (partial: boolean, text: string) => void) {
    this.sendAudio = sendAudio
    this.sendTranscript = sendTranscript
  }

  pushAudio(pcm16: Buffer) {
    this.stt.push(pcm16)
  }

  stopTTS() {
    this.tts.stop()
  }

  close() {
    this.stt.close()
    this.tts.close()
  }
}

