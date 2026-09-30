// POST /api/admin/seed-demo — carrega os produtos demonstrativos (só insere, nunca apaga).
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { seedDemo } from '@/lib/demo-seed'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  try {
    const result = await seedDemo()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[seed-demo]', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
