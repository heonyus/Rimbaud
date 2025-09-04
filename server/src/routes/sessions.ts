import { FastifyInstance } from 'fastify'
import { WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { DirectionalPipeline } from '../pipeline/bridge.js'
import { env } from '../env.js'
import { ClientMessage, ServerMessage } from '../types/messages.js'

type Role = 'A' | 'B'
type Lang = 'ko' | 'en' | 'ja'

type Peer = {
  ws: WebSocket
  lang?: Lang
  voiceId?: string
}

type Session = {
  id: string
  peers: Partial<Record<Role, Peer>>
  pipeAB?: DirectionalPipeline
  pipeBA?: DirectionalPipeline
}

const sessions = new Map<string, Session>()

function parseMsg(data: WebSocket.RawData): ClientMessage | null {
  try {
    return JSON.parse(String(data))
  } catch {
    return null
  }
}

export function registerSessionRoutes(app: FastifyInstance) {
  app.post('/api/sessions', async () => ({ id: uuidv4() }))

  app.get('/ws/session/:id/:role', { websocket: true }, (connection, req) => {
    const { id, role } = req.params as { id: string; role: Role }
    let sess = sessions.get(id)
    if (!sess) {
      sess = { id, peers: {} }
      sessions.set(id, sess)
    }
    const ws = connection.socket as unknown as WebSocket
    const peer: Peer = { ws }
    sess.peers[role] = peer

    const send = (msg: ServerMessage) => {
      try { ws.send(JSON.stringify(msg)) } catch {}
    }
    send({ type: 'ready' })

    ws.on('message', async (data) => {
      const msg = parseMsg(data)
      if (!msg) return
      if (msg.type === 'ping') {
        send({ type: 'pong', t: msg.t })
        return
      }
      if (msg.type === 'hello') {
        peer.lang = msg.lang as Lang
        peer.voiceId = msg.voiceId
        const otherRole: Role = role === 'A' ? 'B' : 'A'
        const other = sess!.peers[otherRole]
        if (other && other.lang) {
          if (!sess!.pipeAB && peer.lang && other.lang) {
            sess!.pipeAB = new DirectionalPipeline({ srcLang: peer.lang, dstLang: other.lang, voiceId: other.voiceId, deepgramKey: env.deepgramKey, elevenKey: env.elevenKey, googleKey: env.googleKey })
            sess!.pipeAB.setSenders(
              (buf) => other.ws.send(JSON.stringify({ type: 'tts_audio', sampleRate: 16000, pcm16: buf.toString('base64') })),
              (partial, text) => other.ws.send(JSON.stringify({ type: 'transcript', dir: 'out', partial, text, srcLang: peer.lang!, dstLang: other.lang! }))
            )
          }
          if (!sess!.pipeBA && peer.lang && other.lang) {
            sess!.pipeBA = new DirectionalPipeline({ srcLang: other.lang, dstLang: peer.lang, voiceId: peer.voiceId, deepgramKey: env.deepgramKey, elevenKey: env.elevenKey, googleKey: env.googleKey })
            sess!.pipeBA.setSenders(
              (buf) => ws.send(JSON.stringify({ type: 'tts_audio', sampleRate: 16000, pcm16: buf.toString('base64') })),
              (partial, text) => ws.send(JSON.stringify({ type: 'transcript', dir: 'out', partial, text, srcLang: other.lang!, dstLang: peer.lang! }))
            )
          }
        }
        return
      }
      if (msg.type === 'control' && msg.action === 'stop-tts') {
        if (role === 'A') sess.pipeBA?.stopTTS()
        else sess.pipeAB?.stopTTS()
        return
      }
      if (msg.type === 'audio') {
        const pcm = Buffer.from(msg.pcm16, 'base64')
        if (role === 'A') sess.pipeAB?.pushAudio(pcm)
        else sess.pipeBA?.pushAudio(pcm)
        return
      }
    })

    const cleanup = () => {
      const otherRole: Role = role === 'A' ? 'B' : 'A'
      if (sess?.peers[role]?.ws === ws) delete sess?.peers[role]
      if (!sess?.peers[otherRole]) {
        sess?.pipeAB?.close()
        sess?.pipeBA?.close()
        sessions.delete(id)
      }
      try { ws.close() } catch {}
    }

    ws.on('close', cleanup)
    ws.on('error', cleanup)
  })
}

