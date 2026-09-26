// GET /api/auth/me — retorna cliente logado ou { customer: null }.
import { NextResponse } from 'next/server'
import { getCurrentCustomer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) return NextResponse.json({ customer: null })
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
