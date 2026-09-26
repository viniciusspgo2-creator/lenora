// Utilidades gerais da Loja Lenora

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// Formata número em R$ 0.000,00
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Soma simples
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

// Mascara telefone (11) 93220-9050
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

// CEP 00000-000
export function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`
  return d
}

export function classNames(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(' ')
}

// Gera número do pedido LEN-2025-0001
export function orderNumber(seq: number): string {
  const year = new Date().getFullYear()
  return `LEN-${year}-${String(seq).padStart(4, '0')}`
}

// Status do pedido -> label amigável + cor
export const ORDER_STATUS: Record<
  string,
  { label: string; color: string }
> = {
  recebido: { label: 'Pedido recebido', color: 'bg-amber-100 text-amber-900' },
  preparo: { label: 'Em preparação', color: 'bg-blue-100 text-blue-900' },
  enviado: { label: 'Enviado', color: 'bg-violet-100 text-violet-900' },
  entregue: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-900' },
  cancelado: { label: 'Cancelado', color: 'bg-rose-100 text-rose-900' },
}
