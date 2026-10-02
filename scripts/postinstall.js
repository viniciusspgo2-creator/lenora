#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- script Node puro (CommonJS), roda fora do Next */
// Postinstall multiplataforma (Windows/Mac/Linux/Vercel) — Loja Lenora.
// Gera o Prisma Client com o schema correto:
//   - Na Vercel (VERCEL=1): prisma/schema.postgres.prisma (PostgreSQL externo)
//   - Local (dev):          prisma/schema.prisma (SQLite, arquivo db/custom.db)
const { execSync } = require('node:child_process')

const isVercel = process.env.VERCEL === '1'
const schema = isVercel ? 'prisma/schema.postgres.prisma' : 'prisma/schema.prisma'

console.log(`[postinstall] Gerando Prisma Client (${isVercel ? 'PostgreSQL/Vercel' : 'SQLite/local'})…`)
try {
  execSync(`npx prisma generate --schema=${schema}`, { stdio: 'inherit' })
  console.log('[postinstall] Prisma Client gerado com sucesso.')
} catch (err) {
  // Nunca quebrar a instalação por causa do generate (ex.: sem rede no primeiro npx).
  console.warn('[postinstall] Aviso: falha ao gerar o Prisma Client automaticamente.')
  console.warn('[postinstall] Rode manualmente depois: npm run db:generate')
  process.exitCode = 0
}
