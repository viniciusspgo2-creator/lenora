// POST /api/admin/products — cria produto (com nested writes images/colors/sizes).
// GET  /api/admin/products — lista produtos para o painel admin.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils-lenora'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const products = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { images: true, colors: true, sizes: true } },
      },
    })
    return NextResponse.json({ items: products })
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
    const description = String(body.description ?? '').trim()
    const price = Number(body.price)
    const categoryId = String(body.categoryId ?? '').trim()
    if (!name || !description || !Number.isFinite(price) || !categoryId) {
      return NextResponse.json(
        { error: 'Nome, descrição, preço e categoria são obrigatórios.' },
        { status: 400 },
      )
    }
    const cat = await db.category.findUnique({ where: { id: categoryId } })
    if (!cat) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 400 })
    }

    // slug único
    let slug = slugify(name)
    let suffix = 1
    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${slugify(name)}-${suffix++}`
    }

    const images: any[] = Array.isArray(body.images) ? body.images : []
    const colors: any[] = Array.isArray(body.colors) ? body.colors : []
    const sizes: any[] = Array.isArray(body.sizes) ? body.sizes : []

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAt: body.compareAt ? Number(body.compareAt) : null,
        sku: body.sku ? String(body.sku) : null,
        status: body.status ? String(body.status) : 'active',
        featured: Boolean(body.featured ?? false),
        categoryId,
        tags: body.tags ? String(body.tags) : null,
        images: {
          create: images.map((img: any, i: number) => ({
            url: String(img.url ?? ''),
            isMain: Boolean(img.isMain ?? i === 0),
            order: typeof img.order === 'number' ? img.order : i,
          })),
        },
        colors: {
          create: colors.map((c: any) => ({
            name: String(c.name ?? ''),
            hex: String(c.hex ?? '#000000'),
            stock: Number(c.stock) || 0,
          })),
        },
        sizes: {
          create: sizes.map((s: any) => ({
            name: String(s.name ?? ''),
            stock: Number(s.stock) || 0,
          })),
        },
      },
      include: { images: true, colors: true, sizes: true, category: true },
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
