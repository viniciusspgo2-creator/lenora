// POST /api/auth/logout — encerra sessão do cliente e limpa cookie.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseCookie(header: string, key: string): string | undefined {
  const parts = header.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === key) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

export async function POST(req: Request) {
  try {
    const token = parseCookie(req.headers.get('cookie') ?? '', 'lenora_session')
    if (token) {
      await db.session.deleteMany({ where: { token } }).catch(() => {})
    }
    const res = NextResponse.json({ ok: true })
    res.headers.append(
      'set-cookie',
      `lenora_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    )
    return res
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
