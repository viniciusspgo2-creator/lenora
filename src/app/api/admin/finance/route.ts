// GET /api/admin/finance — lista lançamentos (filtros ?type= & ?status=).
// POST /api/admin/finance — cria lançamento.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const url = new URL(req.url)
    const type = url.searchParams.get('type') ?? undefined
    const status = url.searchParams.get('status') ?? undefined

    const where: any = {}
    if (type && ['entrada', 'saida'].includes(type)) where.type = type
    if (status && ['pendente', 'pago', 'recebido'].includes(status))
      where.status = status

    const items = await db.financialEntry.findMany({
      where,
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        order: { select: { id: true, orderNumber: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const body = await req.json()
    const type = String(body.type ?? '').trim()
    const description = String(body.description ?? '').trim()
    const category = String(body.category ?? '').trim()
    const amount = Number(body.amount)

    if (!['entrada', 'saida'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória.' },
        { status: 400 },
      )
    }
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória.' },
        { status: 400 },
      )
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }

    // Valida status de acordo com type.
    let status = String(body.status ?? 'pendente').trim()
    if (!['pendente', 'pago', 'recebido'].includes(status))
      status = 'pendente'
    if (type === 'entrada' && status === 'pago') status = 'recebido'
    if (type === 'saida' && status === 'recebido') status = 'pago'

    // Se tem paidAt, força status coerente.
    const paidAt = body.paidAt ? new Date(body.paidAt) : null
    if (paidAt) {
      status = type === 'entrada' ? 'recebido' : 'pago'
    }

    const data: any = {
      type,
      description,
      category,
      amount,
      status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt,
      method: body.method ? String(body.method) : null,
      orderId: body.orderId ? String(body.orderId) : null,
      supplierId: body.supplierId ? String(body.supplierId) : null,
      notes: body.notes ? String(body.notes) : null,
    }

    const entry = await db.financialEntry.create({ data })
    return NextResponse.json({ entry }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
