// POST /api/auth/login — login de cliente (Loja Lenora).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
    }

    const customer = await db.customer.findUnique({ where: { email } })
    if (!customer) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }
    if (!verifyPassword(password, customer.passwordHash)) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    const token = await createSession(customer.id)
    const res = NextResponse.json({
      customer: { id: customer.id, name: customer.name, email: customer.email },
    })
    res.headers.append(
      'set-cookie',
      `lenora_session=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
    )
    return res
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
