import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

export const env = {
  port: Number(process.env.PORT || 8787),
  deepgramKey: process.env.DEEPGRAM_API_KEY || '',
  elevenKey: process.env.ELEVENLABS_API_KEY || '',
  googleKey: process.env.GOOGLE_CLOUD_API_KEY || ''
}

export function requireEnv() {
  if (!env.deepgramKey) throw new Error('Missing DEEPGRAM_API_KEY')
  if (!env.elevenKey) throw new Error('Missing ELEVENLABS_API_KEY')
  if (!env.googleKey) throw new Error('Missing GOOGLE_CLOUD_API_KEY')
}

