// PUT /api/admin/finance/[id] — atualiza lançamento.
// DELETE /api/admin/finance/[id] — remove lançamento.
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
    const existing = await db.financialEntry.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Lançamento não encontrado.' },
        { status: 404 },
      )
    }

    const data: any = {}

    if (body.type !== undefined) {
      if (!['entrada', 'saida'].includes(body.type)) {
        return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
      }
      data.type = body.type
    }
    if (body.description !== undefined) {
      const d = String(body.description).trim()
      if (!d)
        return NextResponse.json(
          { error: 'Descrição obrigatória.' },
          { status: 400 },
        )
      data.description = d
    }
    if (body.category !== undefined) {
      data.category = String(body.category)
    }
    if (body.amount !== undefined) {
      const v = Number(body.amount)
      if (!Number.isFinite(v) || v < 0)
        return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
      data.amount = v
    }
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.paidAt !== undefined) {
      data.paidAt = body.paidAt ? new Date(body.paidAt) : null
    }
    if (body.method !== undefined) {
      data.method = body.method ? String(body.method) : null
    }
    if (body.orderId !== undefined) {
      data.orderId = body.orderId ? String(body.orderId) : null
    }
    if (body.supplierId !== undefined) {
      data.supplierId = body.supplierId ? String(body.supplierId) : null
    }
    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes) : null
    }
    if (body.status !== undefined) {
      // status coercion baseado no type (final)
      const t = data.type ?? existing.type
      let s = String(body.status)
      if (!['pendente', 'pago', 'recebido'].includes(s))
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
      if (t === 'entrada' && s === 'pago') s = 'recebido'
      if (t === 'saida' && s === 'recebido') s = 'pago'
      data.status = s
      // Se está marcando como pago/recebido, também define paidAt
      if (s !== 'pendente' && !data.paidAt && !existing.paidAt) {
        data.paidAt = new Date()
      }
      // Se voltou para pendente, limpa paidAt
      if (s === 'pendente') data.paidAt = null
    }

    const updated = await db.financialEntry.update({
      where: { id },
      data,
    })
    return NextResponse.json({ entry: updated })
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
    await db.financialEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
