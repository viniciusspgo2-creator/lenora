// GET /api/admin/suppliers — lista fornecedores.
// POST /api/admin/suppliers — cria fornecedor.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const items = await db.supplier.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { entries: true } } },
    })

    return NextResponse.json({
      items: items.map((s) => ({
        ...s,
        entriesCount: s._count?.entries ?? 0,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const body = await req.json()
    const name = String(body.name ?? '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        contact: body.contact ? String(body.contact) : null,
        phone: body.phone ? String(body.phone) : null,
        email: body.email ? String(body.email) : null,
        cnpj: body.cnpj ? String(body.cnpj) : null,
        notes: body.notes ? String(body.notes) : null,
      },
    })
    return NextResponse.json({ supplier }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
