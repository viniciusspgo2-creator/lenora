// GET /api/admin/coupons — lista cupons.
// POST /api/admin/coupons — cria cupom (admin).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ items: coupons })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const body = await req.json()
    const code = String(body.code ?? '').trim().toUpperCase()
    const type = String(body.type ?? '').trim()
    const value = Number(body.value)

    if (!code || !type || !['percent', 'fixed'].includes(type)) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }

    const existing = await db.coupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Cupom já existe.' }, { status: 409 })
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        value,
        minSubtotal: Number(body.minSubtotal) || 0,
        maxUses: Number(body.maxUses) || 0,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validTo: body.validTo ? new Date(body.validTo) : null,
        active: body.active ?? true,
      },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
