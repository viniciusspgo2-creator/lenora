// POST /api/visits — registra uma visita por sessão (cookie lenora_visit_sid).
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') ?? ''
    let sid = parseCookie(cookieHeader, 'lenora_visit_sid')
    let setCookie = false
    if (!sid) {
      sid = randomBytes(16).toString('hex')
      setCookie = true
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '/'
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()?.slice(0, 64) ?? null
    const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null

    await db.visit.create({
      data: { path, sessionId: sid, ip, userAgent: ua, referrer },
    })

    const res = NextResponse.json({ ok: true })
    if (setCookie) {
      res.headers.append(
        'set-cookie',
        `lenora_visit_sid=${sid}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
      )
    }
    return res
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

function parseCookie(header: string, key: string): string | undefined {
  const parts = header.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === key) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
