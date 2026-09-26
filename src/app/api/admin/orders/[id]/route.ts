// PATCH /api/admin/orders/[id] — atualiza status / notas do pedido.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    const body = await req.json()
    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    const data: any = {}
    if (body.status !== undefined) {
      const s = String(body.status)
      if (!['recebido', 'preparo', 'enviado', 'entregue', 'cancelado'].includes(s)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
      }
      data.status = s
    }
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null

    const updated = await db.order.update({ where: { id }, data, include: { items: true } })
    return NextResponse.json({ order: updated })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
