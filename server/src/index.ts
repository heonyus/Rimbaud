import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { env, requireEnv } from './env.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerSessionRoutes } from './routes/sessions.js'
import { registerVoiceRoutes } from './routes/voices.js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: true })
await app.register(multipart)
await app.register(websocket)

registerHealthRoutes(app)
registerSessionRoutes(app)
registerVoiceRoutes(app)

requireEnv()
await app.listen({ port: env.port, host: '0.0.0.0' })
