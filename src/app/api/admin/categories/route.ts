// GET  /api/admin/categories — lista TODAS as categorias (ativas + inativas) com contagem de produtos.
// POST /api/admin/categories — cria categoria (admin).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils-lenora'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json({
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        order: c.order,
        active: c.active,
        createdAt: c.createdAt,
        productCount: c._count.products,
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
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

    let slug = slugify(name)
    // Garante unicidade
    let suffix = 1
    while (await db.category.findUnique({ where: { slug } })) {
      slug = `${slugify(name)}-${suffix++}`
    }

    const cat = await db.category.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description) : null,
        image: body.image ? String(body.image) : null,
        active: body.active ?? true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    })
    return NextResponse.json({ category: cat }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
