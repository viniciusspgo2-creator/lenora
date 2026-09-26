// Loja Lenora — Admin Customers.
// Lista clientes (cadastros) com busca. Click na linha → Sheet com detalhe
// (pedidos do cliente). Delete com confirmação.
'use client'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  Users,
  Search,
  Trash2,
  Loader2,
  ChevronRight,
  Mail,
  Phone,
  ShoppingBag,
  X,
  Heart,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/settings'
import { formatBRL, ORDER_STATUS } from '@/lib/utils-lenora'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

type CustomerRow = {
  id: string
  name: string
  email: string
  phone?: string | null
  createdAt: string
  ordersCount: number
  lastOrderAt?: string | null
}

type CustomerOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  status: string
  createdAt: string
  _count?: { items: number }
}

type CustomerDetail = {
  id: string
  name: string
  email: string
  phone?: string | null
  createdAt: string
  favoritesCount: number
  ordersCount: number
  orders: CustomerOrder[]
}

export function AdminCustomers({ settings }: { settings: SiteSettings }) {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

  const listQ = useQuery<{ items: CustomerRow[] }>({
    queryKey: ['admin', 'customers', { q: q.trim() || null }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const qs = params.toString()
      return fetch(`/api/admin/customers${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('customers')),
      )
    },
    staleTime: 15_000,
  })

  const detailQ = useQuery<CustomerDetail>({
    queryKey: ['admin', 'customers', 'detail', openId],
    enabled: !!openId,
    queryFn: () =>
      fetch(`/api/admin/customers/${openId}`, { cache: 'no-store' }).then(
        (r) =>
          r.ok
            ? r.json().then((d) => d.customer)
            : Promise.reject(new Error('detail')),
      ),
    staleTime: 0,
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Cliente excluído. Pedidos preservados.')
      setDeleteId(null)
      setOpenId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const customers = listQ.data?.items ?? []
  const detail = detailQ.data

  const filtered = useMemo(() => customers, [customers])

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Cadastros
          </p>
          <h2 className="font-serif text-2xl">Clientes</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, email ou telefone…"
            className="h-10 pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        {listQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Users className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {q.trim()
                ? 'Nenhum cliente encontrado para a busca.'
                : 'Ainda não há clientes cadastrados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Cliente</th>
                  <th className="px-3 py-3 hidden sm:table-cell">E-mail</th>
                  <th className="px-3 py-3">Telefone</th>
                  <th className="px-3 py-3">Pedidos</th>
                  <th className="px-3 py-3 hidden md:table-cell">
                    Último pedido
                  </th>
                  <th className="px-3 py-3 hidden lg:table-cell">
                    Cadastro
                  </th>
                  <th className="px-3 py-3 text-right">Abrir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setOpenId(c.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-medium text-foreground">{c.name}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs">
                      {c.email}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {c.phone ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded bg-accent/15 px-2 py-1 text-[10px] uppercase tracking-wider text-accent">
                        {c.ordersCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-[11px] text-muted-foreground">
                      {c.lastOrderAt
                        ? format(parseISO(c.lastOrderAt), 'dd/MM/yyyy')
                        : '—'}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-[11px] text-muted-foreground">
                      {format(parseISO(c.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL SHEET */}
      <Sheet
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-xl lg:max-w-2xl"
        >
          <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <SheetDescription className="text-[10px] uppercase tracking-[0.25em]">
                Cliente
              </SheetDescription>
              <SheetTitle className="font-serif text-xl">
                {detail?.name ?? '—'}
              </SheetTitle>
            </div>
            {detail && (
              <button
                onClick={() => {
                  setDeleteId(detail.id)
                  setDeleteName(detail.name)
                }}
                aria-label="Excluir cliente"
                className="grid size-10 place-items-center rounded-md text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </SheetHeader>

          {detailQ.isLoading ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : detail ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* DADOS */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <h3 className="mb-3 font-serif text-base">Dados</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoBlock
                    icon={Mail}
                    label="E-mail"
                    value={detail.email}
                  />
                  <InfoBlock
                    icon={Phone}
                    label="Telefone"
                    value={detail.phone ?? '—'}
                  />
                  <InfoBlock
                    icon={Heart}
                    label="Favoritos"
                    value={String(detail.favoritesCount)}
                  />
                  <InfoBlock
                    icon={Calendar}
                    label="Cadastrado em"
                    value={format(parseISO(detail.createdAt), 'dd/MM/yyyy')}
                  />
                </div>
              </section>

              {/* PEDIDOS */}
              <section className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-serif text-base">
                    Pedidos ({detail.ordersCount})
                  </h3>
                  <ShoppingBag className="size-4 text-accent" />
                </div>

                {detail.orders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sem pedidos registrados.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.orders.map((o) => {
                      const st =
                        ORDER_STATUS[o.status] ?? {
                          label: o.status,
                          color: 'bg-muted',
                        }
                      return (
                        <li
                          key={o.id}
                          className="rounded-md border border-border bg-background p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-xs text-foreground">
                              {o.orderNumber}
                            </p>
                            <span
                              className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${st.color}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(o.createdAt), 'dd/MM/yyyy')} ·{' '}
                              {o._count?.items ?? 0} itens
                            </span>
                            <span className="font-medium">
                              {formatBRL(o.total)}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
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

      {/* DELETE CONFIRM */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${deleteName}"?`}
              <br />
              Os pedidos permanecem no sistema, desvinculados da conta.
              Sessões e favoritos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMut.mutate(deleteId)}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {delMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-center text-[11px] text-muted-foreground">
        {settings.brandName} · Cadastro de clientes
      </p>
    </div>
  )
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="break-words text-sm">{value}</p>
      </div>
    </div>
  )
}
