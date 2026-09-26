// POST /api/orders — cria pedido (público).
// GET  /api/orders — lista pedidos (admin) com filtros ?status= e ?q=.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orderNumber } from '@/lib/utils-lenora'
import { requireAdmin } from '@/lib/admin-guard'
import { getCurrentCustomer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // valida campos mínimos
    const customerName = String(body.customerName ?? '').trim()
    const customerPhone = String(body.customerPhone ?? '').trim()
    const items: any[] = Array.isArray(body.items) ? body.items : []
    if (!customerName || !customerPhone || items.length === 0) {
      return NextResponse.json(
        { error: 'Nome, telefone e itens são obrigatórios.' },
        { status: 400 },
      )
    }
    const subtotal = Number(body.subtotal) || 0
    const discount = Number(body.discount) || 0
    const shippingCost = Number(body.shippingCost) || 0
    const total = Number(body.total) || subtotal - discount + shippingCost
    const shippingMethod = String(body.shippingMethod ?? 'retirada')
    const couponCode = body.couponCode ? String(body.couponCode).toUpperCase() : null
    const notes = body.notes ? String(body.notes) : null

    // calcula número do pedido (seq = qtd de pedidos no ano + 1)
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const count = await db.order.count({ where: { createdAt: { gte: yearStart } } })
    const num = orderNumber(count + 1)

    // vincula ao cliente logado (se houver)
    const customer = await getCurrentCustomer()

    // incrementa uso do cupom se válido
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } })
      if (coupon && coupon.active) {
        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {})
      }
    }

    const order = await db.order.create({
      data: {
        orderNumber: num,
        customerId: customer?.id ?? null,
        customerName,
        customerPhone,
        customerEmail: body.customerEmail ? String(body.customerEmail) : null,
        customerCep: body.customerCep ? String(body.customerCep) : null,
        customerAddress: body.customerAddress ? String(body.customerAddress) : null,
        subtotal,
        discount,
        couponCode,
        shippingMethod,
        shippingCost,
        total,
        notes,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId ?? null,
            productName: String(it.productName ?? ''),
            productImg: it.productImg ? String(it.productImg) : null,
            price: Number(it.price) || 0,
            quantity: Math.max(1, Number(it.quantity) || 1),
            color: it.color ? String(it.color) : null,
            size: it.size ? String(it.size) : null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ order, orderNumber: num }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const sp = req.nextUrl.searchParams
    const status = sp.get('status') ?? undefined
    const q = sp.get('q')?.toLowerCase() ?? undefined

    const where: any = {}
    if (status) where.status = status
    if (q) {
      where.OR = [
        { orderNumber: { contains: q } },
        { customerPhone: { contains: q } },
        { customerName: { contains: q } },
      ]
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true, _count: { select: { items: true } } },
      take: 200,
    })
    return NextResponse.json({ items: orders })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
