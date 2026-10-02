// Loja Lenora — Admin Dashboard.
// KPIs (pedidos hoje, visitas hoje, produtos ativos, receita total),
// gráfico de visitas dos últimos 14 dias (recharts), pedidos recentes e top paths.
'use client'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  ShoppingCart,
  Eye,
  PackageCheck,
  Wallet,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { formatBRL, ORDER_STATUS } from '@/lib/utils-lenora'
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

type OrderItem = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  total: number
  status: string
  createdAt: string
  _count?: { items: number }
}

type ProductItem = {
  id: string
  name: string
  status: string
  price: number
  category?: { name: string }
  _count?: { images: number; colors: number; sizes: number }
}

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function KPI({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string
  value: string
  icon: typeof ShoppingCart
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 font-serif text-3xl text-foreground">{value}</p>
          {hint && (
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-5 text-accent" />
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard({ settings }: { settings: SiteSettings }) {
  const visits = useQuery<VisitsData>({
    queryKey: ['admin', 'visits'],
    queryFn: () =>
      fetch('/api/admin/visits', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('visits')),
      ),
    staleTime: 30_000,
  })

  const ordersQuery = useQuery<{ items: OrderItem[] }>({
    queryKey: ['admin', 'orders', { dashboard: true }],
    queryFn: () =>
      fetch('/api/orders', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('orders')),
      ),
    staleTime: 20_000,
  })

  const productsQuery = useQuery<{ items: ProductItem[] }>({
    queryKey: ['admin', 'products'],
    queryFn: () =>
      fetch('/api/admin/products', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('products')),
      ),
    staleTime: 30_000,
  })

  const orders = ordersQuery.data?.items ?? []
  const products = productsQuery.data?.items ?? []
  const todayStart = startOfDay().getTime()
  const ordersToday = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= todayStart,
  )
  const revenue = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((s, o) => s + (o.total || 0), 0)
  const activeProducts = products.filter((p) => p.status === 'active')

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          title="Pedidos hoje"
          value={String(ordersToday.length)}
          icon={ShoppingCart}
          hint={`de ${orders.length} totais`}
        />
        <KPI
          title="Visitas hoje"
          value={
            visits.isLoading ? '—' : String(visits.data?.today ?? 0)
          }
          icon={Eye}
          hint={
            visits.data
              ? `${visits.data.last7days} nos últimos 7 dias`
              : 'carregando…'
          }
        />
        <KPI
          title="Produtos ativos"
          value={
            productsQuery.isLoading
              ? '—'
              : String(activeProducts.length)
          }
          icon={PackageCheck}
          hint={`${products.length} cadastrados`}
        />
        <KPI
          title="Receita total"
          value={formatBRL(revenue)}
          icon={Wallet}
          hint="soma de pedidos válidos"
        />
      </div>

      {/* Gráfico + Top paths */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg">Visitas — últimos 14 dias</h3>
              <p className="text-[11px] text-muted-foreground">
                Distribuição diária de visitantes únicos
              </p>
            </div>
            <TrendingUp className="size-5 text-accent" />
          </div>

          {visits.isLoading ? (
            <div className="h-64 w-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visits.data?.byDay ?? []}
                  margin={{ top: 6, right: 6, bottom: 4, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(d: string) => d.slice(5)}
                    interval={1}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(219,39,119,.08)' }}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(l: string) => `Data: ${l}`}
                  />
                  <Bar dataKey="count" name="Visitas" radius={[4, 4, 0, 0]}>
                    {(visits.data?.byDay ?? []).map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.count > 0
                            ? 'var(--accent)'
                            : 'color-mix(in oklab, var(--accent) 35%, transparent)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg">Top páginas</h3>
            <ArrowUpRight className="size-5 text-accent" />
          </div>
          {visits.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : visits.data?.topPaths?.length ? (
            <ul className="space-y-2">
              {visits.data.topPaths.map((p, i) => (
                <li
                  key={p.path + i}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="truncate font-mono text-xs text-foreground">
                    {p.path}
                  </span>
                  <Badge className="bg-accent text-accent-foreground">
                    {p.count}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem visitas registradas ainda.
            </p>
          )}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Pedidos recentes</h3>
            <p className="text-[11px] text-muted-foreground">
              Últimos 5 pedidos recebidos
            </p>
          </div>
          <a
            href="/?view=admin&tab=orders"
            className="text-[11px] uppercase tracking-[0.2em] text-accent hover:underline"
          >
            Ver todos
          </a>
        </div>
        {ordersQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : recentOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum pedido ainda. 🌸
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Pedido</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Itens</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const status = ORDER_STATUS[o.status] ?? {
                    label: o.status,
                    color: 'bg-muted text-muted-foreground',
                  }
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 pr-3 font-mono text-xs">
                        {o.orderNumber}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">
                          {o.customerName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {o.customerPhone}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {o._count?.items ?? '—'}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatBRL(o.total)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {settings.brandName} · Painel administrativo · v1.0
      </p>
    </div>
  )
}
