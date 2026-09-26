// GET /api/orders/[id] — detalhe de pedido (admin) ou dono (por orderNumber ou id).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) {
      // tenta por orderNumber (caso o cliente use o código LEN-2025-0001)
      const byNum = await db.order.findUnique({
        where: { orderNumber: id },
        include: { items: true },
      })
      if (!byNum) {
        return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
      }
      return NextResponse.json({ order: byNum })
    }
    return NextResponse.json({ order })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
