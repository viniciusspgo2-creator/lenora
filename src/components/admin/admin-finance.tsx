// Loja Lenora — Admin Finance.
// Lançamentos financeiros (entradas/saídas) + KPIs + gráficos +
// tabela de lançamentos com filtros, tabs e editor (Dialog).
'use client'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Loader2,
  Save,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Banknote,
  X,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/settings'
import { formatBRL } from '@/lib/utils-lenora'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
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

type Supplier = {
  id: string
  name: string
}

type Entry = {
  id: string
  type: 'entrada' | 'saida'
  description: string
  category: string
  amount: number
  dueDate?: string | null
  paidAt?: string | null
  status: string
  method?: string | null
  orderId?: string | null
  supplierId?: string | null
  notes?: string | null
  createdAt: string
  order?: { id: string; orderNumber: string } | null
  supplier?: { id: string; name: string } | null
}

type Summary = {
  entradas: number
  saidas: number
  saldo: number
  aReceber: number
  aPagar: number
  entradasMes: number
  saidasMes: number
  saldoMes: number
  byMonth: { month: string; entradas: number; saidas: number }[]
  byCategory: { category: string; total: number }[]
}

const CATEGORIES = [
  'Venda',
  'Compra de Estoque',
  'Frete',
  'Marketing',
  'Fixo',
  'Fornecedor',
  'Outro',
]

const METHODS = [
  { id: 'pix', label: 'Pix' },
  { id: 'cartao', label: 'Cartão' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'transferencia', label: 'Transferência' },
]

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  recebido: 'Recebido',
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-900',
  pago: 'bg-emerald-100 text-emerald-900',
  recebido: 'bg-emerald-100 text-emerald-900',
}

type FormState = {
  type: 'entrada' | 'saida'
  description: string
  category: string
  amount: string
  dueDate: string
  method: string
  supplierId: string
  notes: string
  status: string
}

const EMPTY_FORM: FormState = {
  type: 'entrada',
  description: '',
  category: 'Venda',
  amount: '',
  dueDate: '',
  method: '',
  supplierId: '',
  notes: '',
  status: 'pendente',
}

const PIE_COLORS = [
  '#DB2777',
  '#0a0a0a',
  '#7a5c1f',
  '#3a3a3a',
  '#a07c2c',
  '#5e1f2e',
  '#888',
]

export function AdminFinance({ settings }: { settings: SiteSettings }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'apagar' | 'areceber' | 'fechamento'>(
    'overview',
  )
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

  // Summary
  const summaryQ = useQuery<Summary>({
    queryKey: ['admin', 'finance', 'summary'],
    queryFn: () =>
      fetch('/api/admin/finance/summary', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('summary')),
      ),
    staleTime: 15_000,
  })

  // Suppliers for select
  const suppliersQ = useQuery<{ items: Supplier[] }>({
    queryKey: ['admin', 'suppliers'],
    queryFn: () =>
      fetch('/api/admin/suppliers', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('suppliers')),
      ),
    staleTime: 30_000,
  })
  const suppliers = suppliersQ.data?.items ?? []

  // Entries list
  const listQ = useQuery<{ items: Entry[] }>({
    queryKey: [
      'admin',
      'finance',
      { type: typeFilter, status: statusFilter },
    ],
    queryFn: () => {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const q = params.toString()
      return fetch(`/api/admin/finance${q ? `?${q}` : ''}`, {
        cache: 'no-store',
      }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('finance')),
      )
    },
    staleTime: 15_000,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        type: form.type,
        description: form.description.trim(),
        category: form.category,
        amount: Number(form.amount),
        dueDate: form.dueDate || null,
        method: form.method || null,
        supplierId: form.supplierId || null,
        notes: form.notes.trim() || null,
        status: form.status,
      }
      const url = editId ? `/api/admin/finance/${editId}` : '/api/admin/finance'
      const method = editId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao salvar')
      return data
    },
    onSuccess: () => {
      toast.success(editId ? 'Lançamento atualizado' : 'Lançamento criado')
      qc.invalidateQueries({ queryKey: ['admin', 'finance'] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const markPaidMut = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const status = type === 'entrada' ? 'recebido' : 'pago'
      const r = await fetch(`/api/admin/finance/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, paidAt: new Date().toISOString() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha')
      return data
    },
    onSuccess: () => {
      toast.success('Lançamento marcado como pago.')
      qc.invalidateQueries({ queryKey: ['admin', 'finance'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/finance/${id}`, { method: 'DELETE' })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Lançamento excluído.')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'finance'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setOpen(true)
  }

  function openEdit(e: Entry) {
    setEditId(e.id)
    setForm({
      type: e.type,
      description: e.description,
      category: e.category,
      amount: String(e.amount),
      dueDate: e.dueDate ? e.dueDate.slice(0, 10) : '',
      method: e.method ?? '',
      supplierId: e.supplierId ?? '',
      notes: e.notes ?? '',
      status: e.status,
    })
    setOpen(true)
  }

  const allEntries = listQ.data?.items ?? []
  const entries = useMemo(() => {
    if (!search.trim()) return allEntries
    const q = search.trim().toLowerCase()
    return allEntries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    )
  }, [allEntries, search])

  // Filter for tabs
  const aPagar = useMemo(
    () =>
      allEntries.filter(
        (e) => e.type === 'saida' && e.status === 'pendente',
      ),
    [allEntries],
  )
  const aReceber = useMemo(
    () =>
      allEntries.filter(
        (e) => e.type === 'entrada' && e.status === 'pendente',
      ),
    [allEntries],
  )

  const summary = summaryQ.data

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Gestão
          </p>
          <h2 className="font-serif text-2xl">Financeiro</h2>
        </div>
        <Button
          onClick={openNew}
          className="btn-gold h-10 gap-2 border-0 px-4 text-xs uppercase tracking-[0.2em]"
        >
          <Plus className="size-4" />
          Novo lançamento
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) =>
          setTab(v as typeof tab)
        }
      >
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-surface p-1.5 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="h-9 gap-1.5 px-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="apagar"
            className="h-9 gap-1.5 px-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            A pagar
            <span className="rounded bg-black/10 px-1 text-[10px]">
              {aPagar.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="areceber"
            className="h-9 gap-1.5 px-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            A receber
            <span className="rounded bg-black/10 px-1 text-[10px]">
              {aReceber.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="fechamento"
            className="h-9 gap-1.5 px-3 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            Fechamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          {/* KPIS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPI
              title="Entradas (mês)"
              value={summary ? formatBRL(summary.entradasMes) : '—'}
              icon={TrendingUp}
              accent="gold"
            />
            <KPI
              title="Saídas (mês)"
              value={summary ? formatBRL(summary.saidasMes) : '—'}
              icon={TrendingDown}
              accent="rose"
            />
            <KPI
              title="Saldo (mês)"
              value={
                summary ? formatBRL(summary.saldoMes) : '—'
              }
              icon={Wallet}
              accent={summary && summary.saldoMes < 0 ? 'rose' : 'gold'}
            />
            <KPI
              title="A pagar"
              value={summary ? formatBRL(summary.aPagar) : '—'}
              icon={Banknote}
              accent="rose"
            />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-5 lg:col-span-2">
              <h3 className="font-serif text-lg">
                Entradas × Saídas — últimos 6 meses
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pagamentos efetivados por mês
              </p>
              {summaryQ.isLoading ? (
                <Skeleton className="mt-4 h-64 w-full" />
              ) : (
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary?.byMonth ?? []}
                      margin={{ top: 6, right: 6, bottom: 4, left: -8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fontSize: 10,
                          fill: 'var(--muted-foreground)',
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: 'var(--muted-foreground)',
                        }}
                        tickFormatter={(v: number) =>
                          v >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : String(v)
                        }
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(219,39,119,.08)' }}
                        contentStyle={{
                          background: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [
                          formatBRL(Number(value)),
                          name === 'entradas' ? 'Entradas' : 'Saídas',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) =>
                          value === 'entradas' ? 'Entradas' : 'Saídas'
                        }
                      />
                      <Bar
                        dataKey="entradas"
                        name="entradas"
                        fill="#DB2777"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="saidas"
                        name="saidas"
                        fill="#0a0a0a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-serif text-lg">Saídas por categoria</h3>
              <p className="text-[11px] text-muted-foreground">
                Mês atual — distribuição
              </p>
              {summaryQ.isLoading ? (
                <Skeleton className="mt-4 h-64 w-full" />
              ) : (summary?.byCategory?.length ?? 0) === 0 ? (
                <div className="mt-4 grid h-64 place-items-center text-sm text-muted-foreground">
                  Sem saídas pagas no mês.
                </div>
              ) : (
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary?.byCategory ?? []}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {(summary?.byCategory ?? []).map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              PIE_COLORS[i % PIE_COLORS.length] ?? '#888'
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [
                          formatBRL(Number(value)),
                          name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => String(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ALL ENTRIES TABLE */}
          <FinanceTable
            entries={entries}
            isLoading={listQ.isLoading}
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onEdit={openEdit}
            onDelete={(e) => {
              setDeleteId(e.id)
              setDeleteName(e.description)
            }}
            onMarkPaid={(e) =>
              markPaidMut.mutate({ id: e.id, type: e.type })
            }
            isMarking={markPaidMut.isPending}
          />
        </TabsContent>

        <TabsContent value="apagar" className="mt-5 space-y-5">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg">Contas a pagar</h3>
                <p className="text-[11px] text-muted-foreground">
                  Saídas pendentes — total {formatBRL(summary?.aPagar ?? 0)}
                </p>
              </div>
              <Banknote className="size-5 text-rose-600" />
            </div>
            {aPagar.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma conta pendente. 🌸
              </p>
            ) : (
              <SimpleList
                entries={aPagar}
                onEdit={openEdit}
                onMarkPaid={(e) =>
                  markPaidMut.mutate({ id: e.id, type: e.type })
                }
                isMarking={markPaidMut.isPending}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="areceber" className="mt-5 space-y-5">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg">Contas a receber</h3>
                <p className="text-[11px] text-muted-foreground">
                  Entradas pendentes — total {formatBRL(summary?.aReceber ?? 0)}
                </p>
              </div>
              <Wallet className="size-5 text-accent" />
            </div>
            {aReceber.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nada a receber. 🌸
              </p>
            ) : (
              <SimpleList
                entries={aReceber}
                onEdit={openEdit}
                onMarkPaid={(e) =>
                  markPaidMut.mutate({ id: e.id, type: e.type })
                }
                isMarking={markPaidMut.isPending}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="fechamento" className="mt-5 space-y-5">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h3 className="font-serif text-xl">Fechamento do mês</h3>
            <p className="text-[11px] text-muted-foreground">
              Resumo do mês corrente ({format(new Date(), 'MM/yyyy')})
            </p>
            <div className="gold-line my-5" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryRow
                label="Entradas"
                value={summary ? formatBRL(summary.entradasMes) : '—'}
                accent="gold"
              />
              <SummaryRow
                label="Saídas"
                value={summary ? formatBRL(summary.saidasMes) : '—'}
                accent="rose"
              />
              <SummaryRow
                label="Saldo"
                value={summary ? formatBRL(summary.saldoMes) : '—'}
                accent={summary && summary.saldoMes < 0 ? 'rose' : 'gold'}
                big
              />
              <SummaryRow
                label="A pagar"
                value={summary ? formatBRL(summary.aPagar) : '—'}
                accent="rose"
              />
            </div>
            <div className="gold-line my-5" />
            <h4 className="mb-3 font-serif text-base">
              Saídas por categoria (mês)
            </h4>
            {(summary?.byCategory?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma saída paga no mês.
              </p>
            ) : (
              <ul className="space-y-2">
                {(summary?.byCategory ?? []).map((c, i) => {
                  const max =
                    summary?.byCategory?.[0]?.total || c.total || 1
                  const pct = max > 0 ? (c.total / max) * 100 : 0
                  return (
                    <li
                      key={c.category + i}
                      className="rounded-md border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{c.category}</span>
                        <span className="font-medium">
                          {formatBRL(c.total)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG EDITOR */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editId ? 'Editar lançamento' : 'Novo lançamento'}
            </DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída financeira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Tipo *
              </Label>
              <RadioGroup
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    type: v as 'entrada' | 'saida',
                  }))
                }
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm ${
                    form.type === 'entrada'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="entrada" className="sr-only" />
                  <TrendingUp className="size-4" />
                  Entrada
                </Label>
                <Label
                  className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm ${
                    form.type === 'saida'
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="saida" className="sr-only" />
                  <TrendingDown className="size-4" />
                  Saída
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Descrição *
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Ex: Compra de estoque — vestidos"
                className="h-11"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Categoria *
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Valor (R$) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0,00"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Vencimento
                </Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Método de pagamento
                </Label>
                <Select
                  value={form.method}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, method: v }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'saida' && (
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Fornecedor
                </Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, supplierId: v }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Notas
              </Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Observação interna"
                className="resize-y"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 px-6 text-xs uppercase tracking-[0.2em]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={
                saveMut.isPending ||
                !form.description.trim() ||
                !form.amount
              }
              className="btn-gold h-11 gap-2 border-0 px-6 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {saveMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${deleteName}"?`}
              <br />
              Esta ação não pode ser desfeita.
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
        {settings.brandName} · Módulo financeiro · entradas/saídas
      </p>
    </div>
  )
}

function FinanceTable({
  entries,
  isLoading,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  onEdit,
  onDelete,
  onMarkPaid,
  isMarking,
}: {
  entries: Entry[]
  isLoading: boolean
  search: string
  setSearch: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  onEdit: (e: Entry) => void
  onDelete: (e: Entry) => void
  onMarkPaid: (e: Entry) => void
  isMarking: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* FILTERS */}
      <div className="flex flex-col items-start gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="recebido">Recebidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição…"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Wallet className="size-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento encontrado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-4 pr-3">Descrição</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3 hidden sm:table-cell">Categoria</th>
                <th className="px-3 py-3">Valor</th>
                <th className="px-3 py-3 hidden md:table-cell">Vencimento</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const isPendente = e.status === 'pendente'
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-medium text-foreground">
                        {e.description}
                      </p>
                      {e.supplier?.name && (
                        <p className="text-[11px] text-muted-foreground">
                          {e.supplier.name}
                        </p>
                      )}
                      {e.order?.orderNumber && (
                        <p className="text-[11px] text-accent">
                          Pedido {e.order.orderNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${
                          e.type === 'entrada'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {e.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs">
                      {e.category}
                    </td>
                    <td
                      className={`px-3 py-3 font-medium ${
                        e.type === 'entrada'
                          ? 'text-accent'
                          : 'text-rose-700'
                      }`}
                    >
                      {e.type === 'entrada' ? '+' : '-'}{' '}
                      {formatBRL(e.amount)}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-[11px] text-muted-foreground">
                      {e.dueDate
                        ? format(parseISO(e.dueDate), 'dd/MM/yyyy')
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${
                          STATUS_COLORS[e.status] ?? 'bg-muted'
                        }`}
                      >
                        {STATUS_LABELS[e.status] ?? e.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isPendente && (
                          <button
                            onClick={() => onMarkPaid(e)}
                            disabled={isMarking}
                            aria-label="Marcar como pago"
                            title="Marcar como pago"
                            className="grid size-9 place-items-center rounded-md text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(e)}
                          aria-label="Editar"
                          className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => onDelete(e)}
                          aria-label="Excluir"
                          className="grid size-9 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SimpleList({
  entries,
  onEdit,
  onMarkPaid,
  isMarking,
}: {
  entries: Entry[]
  onEdit: (e: Entry) => void
  onMarkPaid: (e: Entry) => void
  isMarking: boolean
}) {
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
        >
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-md ${
              e.type === 'entrada'
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900'
            }`}
          >
            {e.type === 'entrada' ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{e.description}</p>
            <p className="text-[11px] text-muted-foreground">
              {e.category}
              {e.dueDate
                ? ` · venc. ${format(parseISO(e.dueDate), 'dd/MM/yyyy')}`
                : ''}
              {e.supplier?.name ? ` · ${e.supplier.name}` : ''}
            </p>
          </div>
          <p
            className={`text-sm font-medium ${
              e.type === 'entrada' ? 'text-accent' : 'text-rose-700'
            }`}
          >
            {formatBRL(e.amount)}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMarkPaid(e)}
              disabled={isMarking}
              aria-label="Marcar como pago"
              title="Marcar como pago"
              className="grid size-9 place-items-center rounded-md text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
            </button>
            <button
              onClick={() => onEdit(e)}
              aria-label="Editar"
              className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted"
            >
              <Pencil className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function SummaryRow({
  label,
  value,
  accent,
  big,
}: {
  label: string
  value: string
  accent?: 'gold' | 'rose'
  big?: boolean
}) {
  const color =
    accent === 'gold'
      ? 'text-accent'
      : accent === 'rose'
        ? 'text-rose-700'
        : 'text-foreground'
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 ${big ? 'font-serif text-xl' : 'text-sm font-medium'} ${color}`}
      >
        {value}
      </p>
    </div>
  )
}

function KPI({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  icon: typeof Wallet
  accent?: 'gold' | 'dark' | 'rose'
}) {
  const iconBg =
    accent === 'gold'
      ? 'bg-accent text-primary'
      : accent === 'rose'
        ? 'bg-rose-100 text-rose-900'
        : 'bg-primary text-accent'
  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {title}
          </p>
          <p
            className={`mt-2 font-serif text-3xl ${
              accent === 'gold'
                ? 'text-accent'
                : accent === 'rose'
                  ? 'text-rose-700'
                  : accent === 'dark'
                    ? 'text-foreground'
                    : 'text-foreground'
            }`}
          >
            {value}
          </p>
        </div>
        <div className={`grid size-11 place-items-center rounded-md ${iconBg}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}
