// Loja Lenora — Admin Orders.
// Lista pedidos com filtro por status + busca. Drawer de detalhe com mudança de
// status, itens, cliente, envio, cupom e notas.
'use client'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  ClipboardList,
  Loader2,
  Phone,
  MapPin,
  Truck,
  Tag,
  Save,
  X,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatBRL,
  ORDER_STATUS,
} from '@/lib/utils-lenora'

type OrderItem = {
  id: string
  productName: string
  productImg?: string | null
  price: number
  quantity: number
  color?: string | null
  size?: string | null
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerCep?: string | null
  customerAddress?: string | null
  subtotal: number
  discount: number
  couponCode?: string | null
  shippingMethod: string
  shippingCost: number
  total: number
  status: string
  notes?: string | null
  createdAt: string
  items?: OrderItem[]
  _count?: { items: number }
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'recebido', label: 'Recebidos' },
  { id: 'preparo', label: 'Em preparo' },
  { id: 'enviado', label: 'Enviados' },
  { id: 'entregue', label: 'Entregues' },
  { id: 'cancelado', label: 'Cancelados' },
] as const

const NEXT_STATUS: Record<string, string[]> = {
  recebido: ['preparo', 'enviado', 'entregue', 'cancelado'],
  preparo: ['enviado', 'entregue', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: ['recebido'],
}

export function AdminOrders() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<(typeof STATUS_FILTERS)[number]['id']>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string | null>(null)

  const status = tab === 'all' ? undefined : tab
  const query = q.trim() || undefined

  const listKey = ['admin', 'orders', { status, q: query }] as const
  const listQ = useQuery<{ items: Order[] }>({
    queryKey: listKey,
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (query) params.set('q', query)
      return fetch(
        `/api/orders${params.toString() ? `?${params.toString()}` : ''}`,
        { cache: 'no-store' },
      ).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('orders')),
      )
    },
    staleTime: 15_000,
  })

  // Detalhe do pedido aberto
  const detailQ = useQuery<Order>({
    queryKey: ['admin', 'orders', 'detail', openId],
    enabled: !!openId,
    queryFn: () =>
      fetch(`/api/orders/${openId}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json().then((d) => d.order) : Promise.reject(new Error('order')),
      ),
    staleTime: 0,
  })

  // Mutation PATCH status/notes
  const patchMut = useMutation({
    mutationFn: async (patch: { status?: string; notes?: string | null }) => {
      if (!openId) throw new Error('no id')
      const r = await fetch(`/api/admin/orders/${openId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao atualizar')
      return data
    },
    onSuccess: () => {
      toast.success('Pedido atualizado.')
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      detailQ.refetch()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const orders = listQ.data?.items ?? []
  const detail = detailQ.data

  const openOrder = (o: Order) => {
    setOpenId(o.id)
    setNewStatus(null)
    setNotes(o.notes ?? '')
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length }
    for (const o of orders) m[o.status] = (m[o.status] ?? 0) + 1
    return m
  }, [orders])

  function applyStatus(s: string) {
    setNewStatus(s)
    patchMut.mutate(
      { status: s, notes: notes ?? null },
      {
        onSuccess: () => {
          setNewStatus(null)
        },
      },
    )
  }

  function saveNotes() {
    patchMut.mutate({ notes: notes.trim() || null })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Vendas
          </p>
          <h2 className="font-serif text-2xl">Pedidos</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nº ou telefone…"
            className="h-10 pl-10"
          />
        </div>
      </div>

      {/* Filtros */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-surface p-1.5 sm:w-auto">
          {STATUS_FILTERS.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="h-9 gap-1.5 px-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              {s.label}
              <span className="rounded bg-black/10 px-1 text-[10px]">
                {counts[s.id] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* TABELA */}
      <div className="rounded-lg border border-border bg-surface">
        {listQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ClipboardList className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {query
                ? 'Nenhum pedido encontrado para a busca.'
                : tab === 'all'
                  ? 'Ainda não há pedidos. 🌸'
                  : 'Sem pedidos nesse status.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Pedido</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Itens</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 hidden md:table-cell">Data</th>
                  <th className="px-3 py-3 text-right">Abrir</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = ORDER_STATUS[o.status] ?? {
                    label: o.status,
                    color: 'bg-muted',
                  }
                  return (
                    <tr
                      key={o.id}
                      onClick={() => openOrder(o)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 pl-4 pr-3 font-mono text-xs">
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
                      <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {o._count?.items ?? o.items?.length ?? 0}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatBRL(o.total)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${st.color}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-[11px] text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL SHEET */}
      <Sheet
        open={!!openId}
        onOpenChange={(o) => {
          if (!o) {
            setOpenId(null)
            setNewStatus(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <SheetDescription className="text-[10px] uppercase tracking-[0.25em]">
                Pedido
              </SheetDescription>
              <SheetTitle className="font-mono text-xl">
                {detail?.orderNumber ?? '—'}
              </SheetTitle>
            </div>
            {detail && (
              <span
                className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${(ORDER_STATUS[detail.status] ?? { color: 'bg-muted' }).color}`}
              >
                {(ORDER_STATUS[detail.status] ?? { label: detail.status })
                  .label}
              </span>
            )}
          </SheetHeader>

          {detailQ.isLoading ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : detail ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* MUDANÇA DE STATUS */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <h3 className="mb-3 font-serif text-base">
                  Atualizar status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUS[detail.status]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Pedido finalizado. Não há próximos passos disponíveis.
                    </p>
                  ) : (
                    NEXT_STATUS[detail.status]?.map((s) => {
                      const st = ORDER_STATUS[s] ?? {
                        label: s,
                        color: 'bg-muted',
                      }
                      return (
                        <button
                          key={s}
                          onClick={() => applyStatus(s)}
                          disabled={
                            patchMut.isPending && newStatus === s
                          }
                          className={`inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs uppercase tracking-wider transition hover:border-accent hover:text-accent disabled:opacity-50 ${
                            s === 'cancelado'
                              ? 'text-destructive hover:border-destructive'
                              : ''
                          }`}
                        >
                          {patchMut.isPending && newStatus === s ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          {st.label}
                        </button>
                      )
                    })
                  )}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Status atual:{' '}
                  <b>
                    {(ORDER_STATUS[detail.status] ?? { label: detail.status })
                      .label}
                  </b>
                </p>
              </section>

              {/* ITENS */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <h3 className="mb-3 font-serif text-base">
                  Itens do pedido
                </h3>
                <ul className="space-y-3">
                  {detail.items?.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-background p-2"
                    >
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                        {it.productImg ? (
                          <img
                            src={it.productImg}
                            alt={it.productName}
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {it.productName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {it.quantity}× ·{' '}
                          {it.color ? `Cor: ${it.color}` : ''}
                          {it.size ? ` · Tam: ${it.size}` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatBRL(it.price * it.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
                  <Row
                    label="Subtotal"
                    value={formatBRL(detail.subtotal)}
                  />
                  {detail.discount > 0 && (
                    <Row
                      label="Desconto"
                      value={`- ${formatBRL(detail.discount)}`}
                      accent
                    />
                  )}
                  <Row
                    label="Envio"
                    value={
                      detail.shippingCost
                        ? formatBRL(detail.shippingCost)
                        : 'A combinar'
                    }
                  />
                  <div className="gold-line my-2" />
                  <Row
                    label="Total"
                    value={formatBRL(detail.total)}
                    big
                  />
                </div>
              </section>

              {/* CLIENTE */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <h3 className="mb-3 font-serif text-base">Cliente</h3>
                <div className="space-y-2 text-sm">
                  <InfoRow
                    icon={Phone}
                    label="Nome"
                    value={`${detail.customerName} · ${detail.customerPhone}`}
                  />
                  {detail.customerEmail && (
                    <InfoRow
                      icon={Tag}
                      label="E-mail"
                      value={detail.customerEmail}
                    />
                  )}
                  {detail.customerCep && (
                    <InfoRow
                      icon={MapPin}
                      label="CEP"
                      value={detail.customerCep}
                    />
                  )}
                  {detail.customerAddress && (
                    <InfoRow
                      icon={MapPin}
                      label="Endereço"
                      value={detail.customerAddress}
                    />
                  )}
                  <InfoRow
                    icon={Truck}
                    label="Envio"
                    value={
                      SHIPPING_LABELS[detail.shippingMethod] ??
                      detail.shippingMethod
                    }
                  />
                  {detail.couponCode && (
                    <InfoRow
                      icon={Tag}
                      label="Cupom"
                      value={detail.couponCode}
                      accent
                    />
                  )}
                </div>
              </section>

              {/* NOTAS */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-base">Notas internas</h3>
                  <button
                    onClick={saveNotes}
                    disabled={patchMut.isPending}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs uppercase tracking-wider text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {patchMut.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Salvar
                  </button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anotações internas sobre o pedido (não visíveis ao cliente)"
                  className="resize-y"
                />
              </section>

              <p className="text-center text-[11px] text-muted-foreground">
                Pedido em{' '}
                {new Date(detail.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Não foi possível carregar.
            </div>
          )}

          <div className="flex items-center justify-end border-t border-border bg-surface p-5">
            <button
              onClick={() => setOpenId(null)}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-xs uppercase tracking-wider hover:border-accent"
            >
              <X className="size-4" />
              Fechar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const SHIPPING_LABELS: Record<string, string> = {
  correios: 'Correios',
  transportadora: 'Transportadora',
  uber: 'Uber / Motoboy',
  retirada: 'Retirada no local',
}

function Row({
  label,
  value,
  accent,
  big,
}: {
  label: string
  value: string
  accent?: boolean
  big?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`${big ? 'font-serif text-lg' : 'text-sm'} font-medium ${
          accent ? 'text-accent' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Phone
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`break-words ${accent ? 'text-accent' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
