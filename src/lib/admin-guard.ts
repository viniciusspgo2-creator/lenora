// Proteção das rotas /api/admin/* (Loja Lenora).
// Compara senha enviada via header `x-admin-password` OU cookie `lenora_admin`
// contra `settings.admin.password` carregado do banco.
import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings-server'

export async function requireAdmin(req: NextRequest | Request): Promise<null | NextResponse> {
  const settings = await getSettings()
  const expected = settings.admin?.password ?? ''

  const fromHeader = req.headers.get('x-admin-password') ?? ''
  const fromCookie =
    (req instanceof NextRequest
      ? req.cookies.get('lenora_admin')?.value
      : parseCookie(req.headers.get('cookie') ?? '', 'lenora_admin')) ?? ''

  // Se não há senha configurada, libera (primeira execução / dev)
  if (!expected) return null

  if (fromHeader === expected || fromCookie === expected) return null
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}

function parseCookie(header: string, key: string): string | undefined {
  const parts = header.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === key) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
