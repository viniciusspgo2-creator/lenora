// GET /api/orders/me — pedidos do cliente logado (cookie) OU por ?phone= query.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentCustomer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer()
    const phoneParam = req.nextUrl.searchParams.get('phone') ?? undefined

    let orders: any[] = []
    if (customer) {
      orders = await db.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
        take: 100,
      })
    } else if (phoneParam) {
      // normaliza só dígitos
      const digits = phoneParam.replace(/\D/g, '')
      if (digits.length >= 8) {
        orders = await db.order.findMany({
          where: { customerPhone: { contains: digits } },
          orderBy: { createdAt: 'desc' },
          include: { items: true },
          take: 100,
        })
      }
    }

    return NextResponse.json({ items: orders, customer })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
