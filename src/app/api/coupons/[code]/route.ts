// GET /api/coupons/[code] — valida cupom para uso no checkout.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const subtotal = Number(req.nextUrl.searchParams.get('subtotal') ?? '0') || 0

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon) {
      return NextResponse.json({ valid: false, reason: 'Cupom não encontrado.' })
    }
    if (!coupon.active) {
      return NextResponse.json({ valid: false, reason: 'Cupom inativo.' })
    }
    const now = new Date()
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ valid: false, reason: 'Cupom ainda não é válido.' })
    }
    if (coupon.validTo && now > coupon.validTo) {
      return NextResponse.json({ valid: false, reason: 'Cupom expirado.' })
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, reason: 'Cupom esgotado.' })
    }
    if (subtotal < coupon.minSubtotal) {
      return NextResponse.json({
        valid: false,
        reason: `Subtotal mínimo de R$ ${coupon.minSubtotal.toFixed(2)} não atingido.`,
      })
    }
    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
