// GET /api/admin/finance/summary — agregados: entradas/saidas/aPagar/aReceber/
// saldo/byMonth (6 últimos meses) /byCategory (saídas do mês atual).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

function startOfMonth(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(1)
  return x
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const entries = await db.financialEntry.findMany()

    const now = new Date()
    const monthStart = startOfMonth()
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    )

    let entradas = 0
    let saidas = 0
    let aReceber = 0
    let aPagar = 0
    let entradasMes = 0
    let saidasMes = 0

    for (const e of entries) {
      const paid = !!e.paidAt || e.status === 'recebido' || e.status === 'pago'
      if (e.type === 'entrada') {
        if (paid) {
          entradas += e.amount
          if (
            e.paidAt &&
            e.paidAt >= monthStart &&
            e.paidAt <= monthEnd
          )
            entradasMes += e.amount
        } else {
          aReceber += e.amount
        }
      } else {
        if (paid) {
          saidas += e.amount
          if (
            e.paidAt &&
            e.paidAt >= monthStart &&
            e.paidAt <= monthEnd
          )
            saidasMes += e.amount
        } else {
          aPagar += e.amount
        }
      }
    }

    // byMonth — últimos 6 meses com {month, entradas, saidas}
    const byMonth: { month: string; entradas: number; saidas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = startOfMonth(d)
      const end = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      )
      let en = 0
      let sa = 0
      for (const e of entries) {
        if (!e.paidAt) continue
        if (e.paidAt < start || e.paidAt > end) continue
        if (e.type === 'entrada') en += e.amount
        else sa += e.amount
      }
      byMonth.push({
        month: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
          d.getFullYear(),
        ).slice(2)}`,
        entradas: en,
        saidas: sa,
      })
    }

    // byCategory — saídas do mês atual agrupadas por category
    const catMap = new Map<string, number>()
    for (const e of entries) {
      if (e.type !== 'saida') continue
      if (!e.paidAt) continue
      if (e.paidAt < monthStart || e.paidAt > monthEnd) continue
      catMap.set(
        e.category,
        (catMap.get(e.category) ?? 0) + e.amount,
      )
    }
    const byCategory = Array.from(catMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      entradas,
      saidas,
      saldo: entradas - saidas,
      aReceber,
      aPagar,
      entradasMes,
      saidasMes,
      saldoMes: entradasMes - saidasMes,
      byMonth,
      byCategory,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
