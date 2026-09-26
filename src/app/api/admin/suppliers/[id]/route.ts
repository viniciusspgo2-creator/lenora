// PUT /api/admin/suppliers/[id] — atualiza fornecedor.
// DELETE /api/admin/suppliers/[id] — remove (se tiver lançamentos, 400).
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
    const existing = await db.supplier.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado.' },
        { status: 404 },
      )
    }

    const data: any = {}
    if (body.name !== undefined) {
      const n = String(body.name).trim()
      if (!n)
        return NextResponse.json(
          { error: 'Nome obrigatório.' },
          { status: 400 },
        )
      data.name = n
    }
    if (body.contact !== undefined)
      data.contact = body.contact ? String(body.contact) : null
    if (body.phone !== undefined)
      data.phone = body.phone ? String(body.phone) : null
    if (body.email !== undefined)
      data.email = body.email ? String(body.email) : null
    if (body.cnpj !== undefined)
      data.cnpj = body.cnpj ? String(body.cnpj) : null
    if (body.notes !== undefined)
      data.notes = body.notes ? String(body.notes) : null

    const updated = await db.supplier.update({ where: { id }, data })
    return NextResponse.json({ supplier: updated })
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
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { entries: true } } },
    })
    if (!supplier) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado.' },
        { status: 404 },
      )
    }
    if ((supplier._count?.entries ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'Fornecedor possui lançamentos financeiros vinculados. Remova-os antes de excluir.',
        },
        { status: 400 },
      )
    }
    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
