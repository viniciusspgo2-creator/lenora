// POST /api/admin/logout — limpa o cookie `lenora_admin`.
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.headers.append(
    'set-cookie',
    'lenora_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
  )
  return res
}
