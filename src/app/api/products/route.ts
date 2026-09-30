// GET /api/products — lista pública de produtos com filtros, ordenação e paginação.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contains } from '@/lib/db-search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const category = sp.get('category') ?? undefined
    const q = sp.get('q')?.toLowerCase() ?? undefined
    const minPrice = sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined
    const maxPrice = sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined
    const color = sp.get('color') ?? undefined
    const size = sp.get('size') ?? undefined
    const sort = sp.get('sort') ?? 'newest'
    const page = Math.max(1, Number(sp.get('page') ?? '1'))
    let pageSize = Number(sp.get('pageSize') ?? '12')
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 12
    if (pageSize > 60) pageSize = 60

    const where: any = { status: 'active' }
    if (category) where.category = { slug: category }
    if (q) {
      where.OR = [
        { name: contains(q) },
        { description: contains(q) },
      ]
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }
    if (color) where.colors = { some: { hex: color } }
    if (size) where.sizes = { some: { name: size } }

    const orderBy: any =
      sort === 'price-asc'
        ? { price: 'asc' }
        : sort === 'price-desc'
          ? { price: 'desc' }
          : sort === 'featured'
            ? [{ featured: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' }

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAt: p.compareAt,
        featured: p.featured,
        category: p.category,
        images: p.images.map((i) => ({ url: i.url, isMain: i.isMain })),
        colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
        sizes: p.sizes.map((s) => ({ name: s.name })),
      })),
      total,
      page,
      pageSize,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
