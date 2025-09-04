import { useEffect, useMemo, useRef, useState } from 'react'
import { base64ToPCM16, encodeBase64PCM, floatTo16BitPCM, resampleLinear, AudioPlayer } from './lib/audio'
import type { ClientMessage, ServerMessage } from '@rimbaud/shared/types/messages'

type Lang = 'ko' | 'en' | 'ja'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [role, setRole] = useState<'A' | 'B'>('A')
  const [lang, setLang] = useState<Lang>('ko')
  const [peerLang, setPeerLang] = useState<Lang>('en')
  const [sessionId, setSessionId] = useState('local-dev')
  const [transcript, setTranscript] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const procRef = useRef<ScriptProcessorNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const [holding, setHolding] = useState(false)

  const apiBase = useMemo(() => (import.meta.env.VITE_API_URL as string) || 'http://localhost:8787', [])
  const wsUrl = useMemo(() => {
    const base = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8787'
    return `${base.replace(/\/$/, '')}/ws/session/${sessionId}/${role}`
  }, [sessionId, role])

  useEffect(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx
    playerRef.current = new AudioPlayer(ctx)
    return () => { ctx.close() }
  }, [])

  async function connect() {
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      const hello: ClientMessage = { type: 'hello', lang, voiceId: localStorage.getItem('rimbaud.voiceId') || undefined }
      ws.send(JSON.stringify(hello))
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (ev) => {
      const msg = JSON.parse(String(ev.data)) as ServerMessage
      if (msg.type === 'transcript') setTranscript(msg.text)
      if (msg.type === 'tts_audio') {
        const pcm = base64ToPCM16(msg.pcm16)
        playerRef.current?.playPCM16Mono(pcm, msg.sampleRate)
      }
    }
  }

  async function startMic() {
    if (!ctxRef.current) return
    const media = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, noiseSuppression: true, echoCancellation: true } })
    mediaRef.current = media
    const ctx = ctxRef.current
    const src = ctx.createMediaStreamSource(media)
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    procRef.current = proc
    proc.onaudioprocess = (e) => {
      if (!holding) return
      const ch = e.inputBuffer.getChannelData(0)
      const f32 = resampleLinear(ch, ctx.sampleRate, 16000)
      const i16 = floatTo16BitPCM(f32)
      const b64 = encodeBase64PCM(i16)
      const frame: ClientMessage = { type: 'audio', sampleRate: 16000, pcm16: b64 }
      wsRef.current?.send(JSON.stringify(frame))
    }
    src.connect(proc)
    proc.connect(ctx.destination)
  }

  function stopMic() {
    procRef.current?.disconnect()
    mediaRef.current?.getTracks().forEach((t) => t.stop())
    procRef.current = null
    mediaRef.current = null
  }

  function toggleHold(down: boolean) {
    setHolding(down)
    if (!down) wsRef.current?.send(JSON.stringify({ type: 'control', action: 'stop-tts' } satisfies ClientMessage as any))
  }

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between py-2">
          <h1 className="text-2xl font-semibold">Rimbaud</h1>
          <div className="flex items-center gap-2">
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as 'A' | 'B')}>
              <option value="A">Role A</option>
              <option value="B">Role B</option>
            </select>
            <button className="btn" onClick={async () => {
              const res = await fetch(`${apiBase}/api/sessions`, { method: 'POST' })
              const j = await res.json()
              setSessionId(j.id)
            }}>New Session</button>
            <input className="input w-56" placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
            <button className="btn-primary btn" onClick={connect}>{connected ? 'Reconnect' : 'Connect'}</button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4 space-y-3">
            <div className="font-semibold">Languages</div>
            <LangSelect value={lang} onChange={setLang} label="Me" />
            <LangSelect value={peerLang} onChange={setPeerLang} label="Peer" />
            <VoicePanel apiBase={apiBase} />
          </div>
          <div className="md:col-span-2 card p-4">
            <div className="font-semibold mb-2">Transcript</div>
            <div className="min-h-[160px] text-lg whitespace-pre-wrap">{transcript}</div>
          </div>
        </div>

        <div className="fixed left-0 right-0 bottom-6 flex items-center justify-center">
          <button
            className={`btn btn-primary text-xl px-8 py-5 ${holding ? 'ring-4 ring-blue-500/30' : ''}`}
            onMouseDown={() => { setHolding(true); startMic() }}
            onMouseUp={() => { toggleHold(false); stopMic() }}
            onTouchStart={() => { setHolding(true); startMic() }}
            onTouchEnd={() => { toggleHold(false); stopMic() }}
          >
            Hold to Talk
          </button>
        </div>
      </div>
    </div>
  )
}

function LangSelect({ value, onChange, label }: { value: Lang; onChange: (v: Lang) => void; label: string }) {
  return (
    <label className="flex items-center gap-2">
      <span className="label w-12">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as Lang)}>
        <option value="ko">Korean</option>
        <option value="en">English</option>
        <option value="ja">Japanese</option>
      </select>
    </label>
  )
}

function VoicePanel({ apiBase }: { apiBase: string }) {
  const [voiceId, setVoiceId] = useState<string>(localStorage.getItem('rimbaud.voiceId') || '')
  const [name, setName] = useState('My Voice')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)

  useEffect(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx
    playerRef.current = new AudioPlayer(ctx)
    return () => { ctx.close() }
  }, [])

  return (
    <div className="space-y-2">
      <div className="font-semibold mt-2">Voice</div>
      <label className="label">ElevenLabs Voice ID</label>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="elevenlabs voiceId" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} />
        <button className="btn" onClick={async () => {
          localStorage.setItem('rimbaud.voiceId', voiceId)
        }}>Save</button>
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={async () => {
          if (!voiceId) return
          const res = await fetch(`${apiBase}/api/voices/validate?voiceId=${encodeURIComponent(voiceId)}`)
          const j = await res.json()
          alert(j.ok ? 'Voice found' : `Invalid: ${j.error || ''}`)
        }}>Validate</button>
        <button className="btn" onClick={async () => {
          if (!voiceId) return
          const res = await fetch(`${apiBase}/api/voices/preview`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ voiceId, text: 'This is Rimbaud preview.' }) })
          const j = await res.json()
          const pcm = base64ToPCM16(j.pcm16)
          playerRef.current?.playPCM16Mono(pcm, j.sampleRate)
        }}>Preview</button>
      </div>
      <div className="label mt-3">Or create a new voice</div>
      <input ref={fileRef} type="file" accept="audio/*" className="input" />
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Voice name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary btn" onClick={async () => {
          const file = fileRef.current?.files?.[0]
          if (!file) { alert('Select an audio file (30–120s)'); return }
          const fd = new FormData()
          fd.set('name', name)
          fd.set('file', file)
          const res = await fetch(`${apiBase}/api/voices`, { method: 'POST', body: fd })
          const j = await res.json()
          if (j.voiceId) { setVoiceId(j.voiceId); localStorage.setItem('rimbaud.voiceId', j.voiceId) }
          else alert('Failed to create voice')
        }}>Create</button>
      </div>
    </div>
  )
}
