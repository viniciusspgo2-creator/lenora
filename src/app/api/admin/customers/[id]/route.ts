// GET /api/admin/customers/[id] — detalhe do cliente + seus pedidos.
// DELETE /api/admin/customers/[id] — remove cliente (cascade orders? no —
// preservamos pedidos, mas desvincula o customerId).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { items: true } },
          },
        },
        _count: { select: { favorites: true, sessions: true } },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
        favoritesCount: customer._count?.favorites ?? 0,
        ordersCount: customer.orders.length,
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          subtotal: o.subtotal,
          discount: o.discount,
          shippingCost: o.shippingCost,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          _count: o._count,
        })),
      },
    })
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
    const customer = await db.customer.findUnique({ where: { id } })
    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado.' },
        { status: 404 },
      )
    }

    // Desvincula pedidos preservando dados (customerId nulo).
    await db.order.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    })
    // Remove sessões e favoritos (cascade natural).
    await db.session.deleteMany({ where: { customerId: id } })
    await db.favorite.deleteMany({ where: { customerId: id } })
    await db.customer.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
