import { FastifyInstance } from 'fastify'

export function registerVoiceRoutes(app: FastifyInstance) {
  // Create a voice by uploading one sample
  app.post('/api/voices', async (req, reply) => {
    const parts = req.parts()
    let name = 'Rimbaud Voice'
    let fileBuf: Buffer | null = null
    let filename = 'sample.wav'
    for await (const part of parts) {
      if (part.type === 'file') {
        filename = part.filename || filename
        const chunks: Buffer[] = []
        for await (const c of part.file) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        fileBuf = Buffer.concat(chunks)
      } else if (part.type === 'field' && part.fieldname === 'name') {
        name = String(part.value)
      }
    }
    if (!fileBuf) return reply.code(400).send({ error: 'Missing file' })

    const fd = new FormData()
    fd.set('name', name)
    const blob = new Blob([fileBuf], { type: 'audio/wav' })
    fd.set('files', blob, filename)

    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
      body: fd
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return reply.code(500).send({ error: 'Failed to create voice', details: txt })
    }
    const j = await res.json()
    return { voiceId: j?.voice_id }
  })

  // Validate an existing voiceId
  app.get('/api/voices/validate', async (req, reply) => {
    const voiceId = (req.query as any)?.voiceId as string | undefined
    if (!voiceId) return reply.code(400).send({ ok: false, error: 'voiceId required' })
    const url = `https://api.elevenlabs.io/v1/voices/${voiceId}`
    const res = await fetch(url, { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' } })
    if (!res.ok) return { ok: false, error: 'not found' }
    return { ok: true, voiceId }
  })

  // Return a short preview audio for a voiceId
  app.post('/api/voices/preview', async (req, reply) => {
    const body = req.body as { voiceId?: string; text?: string; language?: 'ko'|'en'|'ja' }
    const voiceId = body.voiceId
    if (!voiceId) return reply.code(400).send({ error: 'voiceId required' })
    const text = body.text || 'Rimbaud voice preview.'
    const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`)
    url.searchParams.set('optimize_streaming_latency', '3')
    url.searchParams.set('output_format', 'pcm_16000')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '', 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
    })
    if (!res.ok || !res.body) return reply.code(500).send({ error: 'preview failed' })
    const chunks: Uint8Array[] = []
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
    const buf = Buffer.concat(chunks.map((u) => Buffer.from(u)))
    return { sampleRate: 16000, pcm16: buf.toString('base64') }
  })
}

