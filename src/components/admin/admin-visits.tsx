// Loja Lenora — Admin Visits.
// Dashboard focado em estatísticas de visitação: números grandes,
// gráfico de barras dos últimos 14 dias e ranking de páginas mais vistas.
'use client'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  Eye,
  Calendar,
  CalendarDays,
  Globe,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

type VisitsData = {
  today: number
  last7days: number
  last30days: number
  total: number
  byDay: { date: string; count: number }[]
  topPaths: { path: string; count: number }[]
}

function fmtDateLabel(d: string) {
  // d é YYYY-MM-DD; mostrar DD/MM
  const [_, m, day] = d.split('-')
  return `${day}/${m}`
}

export function AdminVisits() {
  const v = useQuery<VisitsData>({
    queryKey: ['admin', 'visits'],
    queryFn: () =>
      fetch('/api/admin/visits', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('visits')),
      ),
    staleTime: 20_000,
  })

  const data = v.data

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Analytics
        </p>
        <h2 className="font-serif text-2xl">Visitas ao site</h2>
      </div>

      {/* BIG NUMBERS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <BigStat
          label="Hoje"
          value={data?.today ?? 0}
          icon={Eye}
          loading={v.isLoading}
        />
        <BigStat
          label="Últimos 7 dias"
          value={data?.last7days ?? 0}
          icon={Calendar}
          loading={v.isLoading}
        />
        <BigStat
          label="Últimos 30 dias"
          value={data?.last30days ?? 0}
          icon={CalendarDays}
          loading={v.isLoading}
        />
        <BigStat
          label="Total geral"
          value={data?.total ?? 0}
          icon={Globe}
          loading={v.isLoading}
        />
      </div>

      {/* CHART */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Visitantes — 14 dias</h3>
            <p className="text-[11px] text-muted-foreground">
              Cada visita única por sessão de navegador.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="size-4 text-accent" />
            {data ? (
              <span>
                média{' '}
                <b className="text-foreground">
                  {(
                    data.byDay.reduce((s, d) => s + d.count, 0) /
                    Math.max(1, data.byDay.length)
                  ).toFixed(1)}
                </b>{' '}
                / dia
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>

        {v.isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.byDay ?? []}
                margin={{ top: 6, right: 6, bottom: 4, left: -20 }}
              >
                <defs>
                  <linearGradient
                    id="visitsGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDateLabel}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--accent)', strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(l: string) =>
                    `Data: ${fmtDateLabel(l)}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Visitas"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#visitsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TOP PATHS */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Páginas mais visitadas</h3>
            <p className="text-[11px] text-muted-foreground">
              Últimos 14 dias
            </p>
          </div>
          <TrendingUp className="size-5 text-accent" />
        </div>
        {v.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : data?.topPaths?.length ? (
          <ul className="space-y-2">
            {data.topPaths.map((p, i) => {
              const max = data.topPaths[0]?.count || 1
              const pct = Math.max(8, Math.round((p.count / max) * 100))
              return (
                <li
                  key={p.path + i}
                  className="relative overflow-hidden rounded-md border border-border bg-background px-3 py-2"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-accent/10"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs">
                      {p.path}
                    </span>
                    <Badge className="bg-accent text-accent-foreground">
                      {p.count}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem visitas registradas ainda.
          </p>
        )}
      </div>
    </div>
  )
}

function BigStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number
  icon: typeof Eye
  loading?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 transition hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 font-serif text-4xl">{value.toLocaleString('pt-BR')}</p>
          )}
        </div>
        <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-5 text-accent" />
        </div>
      </div>
      <div className="gold-line mt-3" />
    </div>
  )
}
