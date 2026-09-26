// GET /api/admin/visits — estatísticas de visitantes.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const last7Start = new Date(todayStart.getTime() - 6 * 86400000)
    const last30Start = new Date(todayStart.getTime() - 29 * 86400000)

    const [today, last7, last30, total, recentRows] = await Promise.all([
      db.visit.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      db.visit.count({ where: { createdAt: { gte: last7Start } } }),
      db.visit.count({ where: { createdAt: { gte: last30Start } } }),
      db.visit.count(),
      db.visit.findMany({
        where: { createdAt: { gte: new Date(todayStart.getTime() - 13 * 86400000) } },
        select: { path: true, createdAt: true },
      }),
    ])

    // byDay: últimos 14 dias
    const byDayMap = new Map<string, number>()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86400000)
      byDayMap.set(fmtDate(d), 0)
    }
    for (const r of recentRows) {
      const key = fmtDate(new Date(r.createdAt))
      if (byDayMap.has(key)) byDayMap.set(key, (byDayMap.get(key) ?? 0) + 1)
    }
    const byDay = Array.from(byDayMap.entries()).map(([date, count]) => ({ date, count }))

    // topPaths: top 8
    const pathMap = new Map<string, number>()
    for (const r of recentRows) {
      const p = r.path || '/'
      pathMap.set(p, (pathMap.get(p) ?? 0) + 1)
    }
    const topPaths = Array.from(pathMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return NextResponse.json({
      today,
      last7days: last7,
      last30days: last30,
      total,
      byDay,
      topPaths,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
