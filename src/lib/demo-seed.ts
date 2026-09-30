// Loja Lenora — carrega categorias e produtos demonstrativos no banco.
// SEGURO: só insere o que ainda não existe (por slug). Nunca apaga nada.
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils-lenora'
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demo-data'

export async function seedDemo() {
  const categoryBySlug: Record<string, string> = {}
  let categoriesCreated = 0
  let productsCreated = 0
  let productsSkipped = 0

  for (const c of DEMO_CATEGORIES) {
    const existing = await db.category.findUnique({ where: { slug: c.slug } })
    if (existing) {
      categoryBySlug[c.slug] = existing.id
      continue
    }
    const created = await db.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        order: c.order,
        active: true,
      },
    })
    categoryBySlug[c.slug] = created.id
    categoriesCreated++
  }

  const mainImageByCat: Record<string, string> = {}

  for (const p of DEMO_PRODUCTS) {
    const slug = slugify(p.name)
    const categoryId = categoryBySlug[p.categorySlug]
    if (!categoryId) continue

    const images = [1, 2, 3].map((n) => `/uploads/rs-${slug}-${n}.webp`)
    if (!(p.categorySlug in mainImageByCat)) mainImageByCat[p.categorySlug] = images[0]

    const exists = await db.product.findUnique({ where: { slug } })
    if (exists) {
      productsSkipped++
      continue
    }

    await db.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt ?? null,
        status: 'active',
        featured: p.featured,
        categoryId,
        sku: `LEN-${slug.toUpperCase().replace(/-/g, '').slice(0, 12)}`,
        tags: p.featured ? 'destaque' : null,
        images: {
          create: images.map((url, i) => ({ url, isMain: i === 0, order: i + 1 })),
        },
        colors: { create: p.colors.map((c) => ({ name: c.name, hex: c.hex, stock: 10 })) },
        sizes: { create: p.sizes.map((s) => ({ name: s.name, stock: s.stock ?? 5 })) },
      },
    })
    productsCreated++
  }

  // Imagem de capa das categorias que ainda não têm
  for (const [catSlug, url] of Object.entries(mainImageByCat)) {
    await db.category.updateMany({ where: { slug: catSlug, image: null }, data: { image: url } })
  }

  return { categoriesCreated, productsCreated, productsSkipped }
}
