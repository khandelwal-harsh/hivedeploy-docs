import type { NextRequest } from 'next/server'

export const config = { runtime: 'edge' }

const RATE_LIMIT_PER_IP = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

const ipBucket = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  const bucket = ipBucket.get(ip)
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= RATE_LIMIT_PER_IP) {
      return false
    }
    bucket.count += 1
    return true
  }
  ipBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  return true
}

export function _testOnly_resetRateBucket() {
  ipBucket.clear()
}

interface FeedbackBody {
  page: string
  verdict: 'up' | 'down'
  comment?: string
}

function isValidBody(b: unknown): b is FeedbackBody {
  if (!b || typeof b !== 'object') return false
  const r = b as Record<string, unknown>
  if (typeof r.page !== 'string' || r.page.length === 0 || r.page.length > 200) return false
  if (r.verdict !== 'up' && r.verdict !== 'down') return false
  if (r.comment !== undefined && typeof r.comment !== 'string') return false
  return true
}

function formatSlackMessage(page: string, verdict: 'up' | 'down', comment: string, ua: string) {
  const emoji = verdict === 'up' ? ':+1:' : ':-1:'
  return [
    `${emoji} *docs feedback* on \`${page}\``,
    comment ? `> ${comment}` : '',
    `_ua: ${ua}_`,
  ]
    .filter(Boolean)
    .join('\n')
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  if (!isValidBody(body)) {
    return new Response('Bad Request', { status: 400 })
  }

  const comment = (body.comment ?? '').slice(0, 1000)
  const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 200)

  const slackUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL
  if (!slackUrl) {
    return new Response('Service Unavailable', { status: 503 })
  }

  await fetch(slackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: formatSlackMessage(body.page, body.verdict, comment, userAgent) }),
  }).catch(() => {
    /* best effort */
  })

  return new Response(null, { status: 204 })
}
