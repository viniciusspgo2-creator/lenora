// PUT    /api/admin/products/[id] — atualiza produto (substitui imagens/cores/tamanhos se enviados).
// DELETE /api/admin/products/[id] — remove produto.
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
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })
    }

    const data: any = {}
    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
      data.name = name
      // atualiza slug apenas se mudou o nome
      const newSlug = slugify(name)
      if (newSlug !== existing.slug) {
        const other = await db.product.findUnique({ where: { slug: newSlug } })
        if (other && other.id !== id) {
          return NextResponse.json({ error: 'Slug em uso.' }, { status: 409 })
        }
        data.slug = newSlug
      }
    }
    if (body.description !== undefined) data.description = String(body.description)
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.compareAt !== undefined) data.compareAt = body.compareAt ? Number(body.compareAt) : null
    if (body.sku !== undefined) data.sku = body.sku ? String(body.sku) : null
    if (body.status !== undefined) data.status = String(body.status)
    if (body.featured !== undefined) data.featured = Boolean(body.featured)
    if (body.tags !== undefined) data.tags = body.tags ? String(body.tags) : null
    if (body.categoryId !== undefined) {
      const cat = await db.category.findUnique({ where: { id: String(body.categoryId) } })
      if (!cat) {
        return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 400 })
      }
      data.categoryId = String(body.categoryId)
    }

    // Substitui relações se enviadas
    if (Array.isArray(body.images)) {
      await db.productImage.deleteMany({ where: { productId: id } })
      if (body.images.length > 0) {
        data.images = {
          create: body.images.map((img: any, i: number) => ({
            url: String(img.url ?? ''),
            isMain: Boolean(img.isMain ?? i === 0),
            order: typeof img.order === 'number' ? img.order : i,
          })),
        }
      }
    }
    if (Array.isArray(body.colors)) {
      await db.productColor.deleteMany({ where: { productId: id } })
      if (body.colors.length > 0) {
        data.colors = {
          create: body.colors.map((c: any) => ({
            name: String(c.name ?? ''),
            hex: String(c.hex ?? '#000000'),
            stock: Number(c.stock) || 0,
          })),
        }
      }
    }
    if (Array.isArray(body.sizes)) {
      await db.productSize.deleteMany({ where: { productId: id } })
      if (body.sizes.length > 0) {
        data.sizes = {
          create: body.sizes.map((s: any) => ({
            name: String(s.name ?? ''),
            stock: Number(s.stock) || 0,
          })),
        }
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: { images: { orderBy: { order: 'asc' } }, colors: true, sizes: true, category: true },
    })
    return NextResponse.json({ product })
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
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
