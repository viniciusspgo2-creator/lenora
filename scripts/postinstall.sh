#!/bin/bash
# Postinstall: gera o Prisma Client no schema certo.
# - Na Vercel (VERCEL=1): usa schema.postgres.prisma (PostgreSQL externo via DATABASE_URL).
# - Local (dev): usa schema.prisma (SQLite) — preview funciona sem DB externo.
set -e
if [ "$VERCEL" = "1" ]; then
  echo "[postinstall] Ambiente Vercel detectado → gerando Prisma Client com schema PostgreSQL"
  npx prisma generate --schema=prisma/schema.postgres.prisma
else
  echo "[postinstall] Ambiente local → gerando Prisma Client com schema SQLite"
  npx prisma generate
fi
