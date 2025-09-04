type Lang = 'ko' | 'en' | 'ja'

export async function translateText(opts: { apiKey: string; text: string; source: Lang; target: Lang }): Promise<string> {
  const url = new URL('https://translation.googleapis.com/language/translate/v2')
  url.searchParams.set('key', opts.apiKey)
  url.searchParams.set('q', opts.text)
  url.searchParams.set('source', opts.source)
  url.searchParams.set('target', opts.target)
  url.searchParams.set('format', 'text')
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) return opts.text
  const j = await res.json().catch(() => null as any)
  const t = j?.data?.translations?.[0]?.translatedText as string | undefined
  return t ?? opts.text
}

