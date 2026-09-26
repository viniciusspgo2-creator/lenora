// PUT /api/admin/categories/[id] — atualiza categoria.
// DELETE /api/admin/categories/[id] — remove se não houver produtos.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils-lenora'
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
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 })
    }

    const data: any = {}
    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
      data.name = name
      // Só regenera slug se o nome mudou e o slug novo não está em uso por outra categoria
      const newSlug = slugify(name)
      if (newSlug !== existing.slug) {
        const other = await db.category.findUnique({ where: { slug: newSlug } })
        if (other && other.id !== id) {
          return NextResponse.json(
            { error: 'Já existe categoria com esse nome.' },
            { status: 409 },
          )
        }
        data.slug = newSlug
      }
    }
    if (body.description !== undefined) data.description = body.description ?? null
    if (body.image !== undefined) data.image = body.image ?? null
    if (body.active !== undefined) data.active = Boolean(body.active)
    if (typeof body.order === 'number') data.order = body.order

    const updated = await db.category.update({ where: { id }, data })
    return NextResponse.json({ category: updated })
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
    const cat = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!cat) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 })
    }
    if (cat._count.products > 0) {
      return NextResponse.json(
        { error: 'Não é possível remover categoria com produtos vinculados.' },
        { status: 400 },
      )
    }
    await db.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
