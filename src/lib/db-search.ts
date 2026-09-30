// Busca "contém" sem diferenciar maiúscula/minúscula.
// Postgres (produção) precisa de `mode: 'insensitive'`; SQLite (dev) não aceita `mode`
// (e já ignora maiúsculas por padrão no LIKE).
const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? '')

export function contains(value: string) {
  return isPostgres
    ? { contains: value, mode: 'insensitive' as const }
    : { contains: value }
}
