// PUT /api/admin/coupons/[id] — atualiza cupom.
// DELETE /api/admin/coupons/[id] — remove cupom.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    const body = await req.json()
    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })
    }

    const data: any = {}
    if (body.code !== undefined) {
      const code = String(body.code).trim().toUpperCase()
      if (!code) return NextResponse.json({ error: 'Código inválido.' }, { status: 400 })
      const other = await db.coupon.findUnique({ where: { code } })
      if (other && other.id !== id) {
        return NextResponse.json({ error: 'Código em uso.' }, { status: 409 })
      }
      data.code = code
    }
    if (body.type !== undefined) {
      if (!['percent', 'fixed'].includes(body.type)) {
        return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
      }
      data.type = body.type
    }
    if (body.value !== undefined) data.value = Number(body.value)
    if (body.minSubtotal !== undefined) data.minSubtotal = Number(body.minSubtotal) || 0
    if (body.maxUses !== undefined) data.maxUses = Number(body.maxUses) || 0
    if (body.validFrom !== undefined) data.validFrom = body.validFrom ? new Date(body.validFrom) : null
    if (body.validTo !== undefined) data.validTo = body.validTo ? new Date(body.validTo) : null
    if (body.active !== undefined) data.active = Boolean(body.active)

    const updated = await db.coupon.update({ where: { id }, data })
    return NextResponse.json({ coupon: updated })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await db.coupon.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
