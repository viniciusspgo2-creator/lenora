// POST /api/auth/register — cadastro de cliente (Loja Lenora).
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const phone = body.phone ? String(body.phone).trim() : null

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios.' },
        { status: 400 },
      )
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha precisa ter no mínimo 6 caracteres.' },
        { status: 400 },
      )
    }

    const existing = await db.customer.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 })
    }

    const customer = await db.customer.create({
      data: { name, email, phone, passwordHash: hashPassword(password) },
    })

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
