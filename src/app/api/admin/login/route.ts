// POST /api/admin/login — autentica senha admin e seta cookie lenora_admin.
import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const password = String(body.password ?? '')
    const settings = await getSettings()
    const expected = settings.admin?.password ?? ''

    if (!expected) {
      return NextResponse.json(
        { error: 'Senha admin não configurada.' },
        { status: 500 },
      )
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.headers.append(
      'set-cookie',
      `lenora_admin=${encodeURIComponent(expected)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
    )
    return res
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
