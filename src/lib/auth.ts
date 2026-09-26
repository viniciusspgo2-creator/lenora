// Auth simples de cliente (Loja Lenora): cadastro/login por email+senha,
// token de sessão em cookie. Sem NextAuth para manter simples.
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const h = scryptSync(pw, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), h)
}

export async function createSession(customerId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30d
  await db.session.create({ data: { token, customerId, expiresAt } })
  return token
}

export async function getCurrentCustomer() {
  const token = (await cookies()).get('lenora_session')?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { customer: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) return null
  return session.customer
}

export async function getCustomerFromToken(token?: string) {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { customer: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.customer
}
