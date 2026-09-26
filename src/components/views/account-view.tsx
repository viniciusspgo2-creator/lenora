// AccountView (Loja Lenora) — login/cadastro (Tabs) + dashboard com pedidos
// (timeline de status) + favoritos + logout.
'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronDown,
  Heart,
  LogOut,
  Package,
  PackageCheck,
  PackageOpen,
  Truck,
  User as UserIcon,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { formatBRL, classNames, ORDER_STATUS } from '@/lib/utils-lenora'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export type CustomerInfo = {
  id: string
  name: string
  email: string
  phone?: string | null
} | null

type OrderItem = {
  id: string
  productName: string
  productImg: string | null
  price: number
  quantity: number
  color: string | null
  size: string | null
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  shippingMethod: string
  createdAt: string
  items: OrderItem[]
}

type Props = {
  settings: SiteSettings
  customer: CustomerInfo
}

const STATUS_STEPS = [
  { key: 'recebido', label: 'Recebido', icon: Package },
  { key: 'preparo', label: 'Em preparo', icon: PackageOpen },
  { key: 'enviado', label: 'Enviado', icon: Truck },
  { key: 'entregue', label: 'Entregue', icon: PackageCheck },
]

export function AccountView({ settings, customer }: Props) {
  if (!customer) return <AuthForms settings={settings} />
  return <Dashboard settings={settings} customer={customer} />
}

// ───────────────────────── Auth Forms ─────────────────────────
function AuthForms({ settings }: { settings: SiteSettings }) {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Erro ao entrar')
      toast.success(`Bem-vinda de volta, ${j.customer.name}!`)
      setTimeout(() => window.location.reload(), 700)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Erro ao cadastrar')
      toast.success(`Conta criada! Bem-vinda, ${j.customer.name}!`)
      setTimeout(() => window.location.reload(), 700)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in container-lenora py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserIcon className="h-6 w-6" />
          </span>
          <h1 className="font-serif text-4xl text-foreground">Minha conta</h1>
          <p className="text-sm text-muted-foreground">
            Acesse para acompanhar seus pedidos e favoritos.
          </p>
          <div className="gold-line w-20" />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="login" className="text-xs uppercase tracking-widest">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="text-xs uppercase tracking-widest">
              Criar conta
            </TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login" className="mt-6">
            <form
              onSubmit={submitLogin}
              className="space-y-4 rounded-md border border-border bg-background p-6"
            >
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="h-11"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-pw">Senha</Label>
                <Input
                  id="login-pw"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="btn-dark h-12 w-full text-xs uppercase tracking-widest"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="link-underline text-accent"
                >
                  Criar agora
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="mt-6">
            <form
              onSubmit={submitRegister}
              className="space-y-4 rounded-md border border-border bg-background p-6"
            >
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Nome completo</Label>
                <Input
                  id="reg-name"
                  required
                  value={regForm.name}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="h-11"
                  placeholder="Como podemos te chamar?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="h-11"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Telefone / WhatsApp</Label>
                <Input
                  id="reg-phone"
                  value={regForm.phone}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="h-11"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-pw">Senha (mín. 6 caracteres)</Label>
                <Input
                  id="reg-pw"
                  type="password"
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="btn-gold h-12 w-full text-xs uppercase tracking-widest"
              >
                {loading ? 'Criando…' : 'Criar conta'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já é cliente?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="link-underline text-accent"
                >
                  Entrar
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ───────────────────────── Dashboard ─────────────────────────
function Dashboard({ settings, customer }: { settings: SiteSettings; customer: NonNullable<CustomerInfo> }) {
  const nav = useViewNav()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ items: Order[] }>({
    queryKey: ['orders-me'],
    queryFn: async () => {
      const r = await fetch('/api/orders/me')
      if (!r.ok) return { items: [] }
      const j = await r.json()
      return { items: (j.items ?? []) as Order[] }
    },
    staleTime: 30 * 1000,
  })

  const orders = data?.items ?? []

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Você saiu da sua conta. Até breve!')
      setTimeout(() => window.location.reload(), 700)
    } catch {
      toast.error('Erro ao sair. Tente novamente.')
    }
  }

  return (
    <div className="fade-in container-lenora py-10 md:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-[0.35em] text-accent">
            Minha conta
          </span>
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
            Olá, {customer.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus pedidos e mantenha seus favoritos sempre à mão.
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => nav({ view: 'favorites' })}
          className="group flex items-center gap-4 rounded-md border border-border bg-background p-5 transition-all hover:border-accent"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-accent">
            <Heart className="h-5 w-5" />
          </span>
          <div className="flex-1 text-left">
            <p className="font-serif text-base">Meus favoritos</p>
            <p className="text-xs text-muted-foreground">Toque para ver sua seleção</p>
          </div>
        </button>
        <button
          onClick={() => nav({ view: 'shop' })}
          className="group flex items-center gap-4 rounded-md border border-border bg-background p-5 transition-all hover:border-accent"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-accent">
            <Package className="h-5 w-5" />
          </span>
          <div className="flex-1 text-left">
            <p className="font-serif text-base">Continuar comprando</p>
            <p className="text-xs text-muted-foreground">Ver novas peças</p>
          </div>
        </button>
        <a
          href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-md border border-border bg-background p-5 transition-all hover:border-accent"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-accent">
            <Truck className="h-5 w-5" />
          </span>
          <div className="flex-1 text-left">
            <p className="font-serif text-base">Atendimento</p>
            <p className="text-xs text-muted-foreground">Falar com a Lenora</p>
          </div>
        </a>
      </div>

      {/* Pedidos */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Meus pedidos</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-md border border-border bg-muted"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-border bg-background px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-serif text-xl">Nenhum pedido ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Quando você finalizar uma compra pelo WhatsApp, ela aparecerá
                aqui com o status de rastreio.
              </p>
            </div>
            <Button
              onClick={() => nav({ view: 'shop' })}
              className="btn-gold h-11 px-6 text-xs uppercase tracking-widest"
            >
              Fazer primeira compra
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="overflow-hidden rounded-md border border-border bg-background"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpanded(expanded === o.id ? null : o.id)
                  }
                  className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif text-lg leading-tight">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {' · '}
                        {o.items.length}{' '}
                        {o.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Total
                      </p>
                      <p className="font-serif text-lg tabular-nums">
                        {formatBRL(o.total)}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <ChevronDown
                      className={classNames(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        expanded === o.id && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {/* Expandable */}
                <AnimatePresence initial={false}>
                  {expanded === o.id && (
                    <motion.div
                      key="expand"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="space-y-6 p-5">
                        {/* Status timeline */}
                        <OrderTimeline status={o.status} />

                        {/* Items */}
                        <div>
                          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                            Itens do pedido
                          </p>
                          <ul className="space-y-3">
                            {o.items.map((it) => (
                              <li
                                key={it.id}
                                className="flex items-center gap-3"
                              >
                                <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                                  {it.productImg ? (
                                    <img
                                      src={it.productImg}
                                      alt={it.productName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                      <Package className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium leading-tight">
                                    {it.productName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {it.quantity}×
                                    {it.color ? ` · ${it.color}` : ''}
                                    {it.size ? ` · Tam ${it.size}` : ''}
                                  </p>
                                </div>
                                <p className="text-sm tabular-nums">
                                  {formatBRL(it.price * it.quantity)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Shipping */}
                        <div>
                          <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                            Envio
                          </p>
                          <p className="text-sm text-foreground/85">
                            {settings.shipping.methods.find(
                              (m) => m.id === o.shippingMethod,
                            )?.label ?? o.shippingMethod}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// ───────────────────────── Status Badge ─────────────────────────
function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS[status] ?? {
    label: status,
    color: 'bg-muted text-foreground',
  }
  return (
    <span
      className={classNames(
        'inline-flex h-7 items-center rounded-full px-3 text-[10px] font-semibold uppercase tracking-widest',
        meta.color,
      )}
    >
      {meta.label}
    </span>
  )
}

// ───────────────────────── Status Timeline ─────────────────────────
function OrderTimeline({ status }: { status: string }) {
  const cancelled = status === 'cancelado'
  const activeIdx = STATUS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="rounded-md border border-border bg-secondary/30 p-5">
      <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        Rastreio do pedido
      </p>
      {cancelled ? (
        <div className="flex items-center gap-3 text-destructive">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <p className="font-serif text-base">Pedido cancelado</p>
            <p className="text-xs text-muted-foreground">
              Em caso de dúvidas, fale com a gente pelo WhatsApp.
            </p>
          </div>
        </div>
      ) : (
        <ol className="flex items-center gap-2">
          {STATUS_STEPS.map((s, i) => {
            const done = i < activeIdx
            const current = i === activeIdx
            const StepIcon = s.icon
            return (
              <li
                key={s.key}
                className="flex flex-1 flex-col items-center gap-2 text-center"
              >
                <div className="flex w-full items-center">
                  <span
                    className={classNames(
                      'h-0.5 flex-1',
                      i === 0 && 'opacity-0',
                      done || current ? 'bg-accent' : 'bg-border',
                    )}
                  />
                  <span
                    className={classNames(
                      'flex size-10 shrink-0 items-center justify-center rounded-full border transition-all',
                      done && 'border-accent bg-accent text-accent-foreground',
                      current &&
                        'border-accent bg-accent/15 text-accent ring-2 ring-accent/30',
                      !done && !current && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    <StepIcon className="h-4 w-4" />
                  </span>
                  <span
                    className={classNames(
                      'h-0.5 flex-1',
                      i === STATUS_STEPS.length - 1 && 'opacity-0',
                      done ? 'bg-accent' : 'bg-border',
                    )}
                  />
                </div>
                <span
                  className={classNames(
                    'text-[10px] uppercase tracking-widest',
                    (done || current) ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
