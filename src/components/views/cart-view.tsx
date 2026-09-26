// CartView (Loja Lenora) — página de carrinho completa com checkout via WhatsApp.
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import {
  useCart,
  type CartItem,
} from '@/lib/store-cart'
import {
  formatBRL,
  maskCep,
  maskPhone,
  classNames,
} from '@/lib/utils-lenora'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

type Props = { settings: SiteSettings }

type CustomerForm = {
  name: string
  phone: string
  email: string
  cep: string
  address: string
}

export function CartView({ settings }: Props) {
  const nav = useViewNav()
  const items = useCart((s) => s.items)
  const coupon = useCart((s) => s.coupon)
  const removeItem = useCart((s) => s.removeItem)
  const updateQty = useCart((s) => s.updateQty)
  const setCoupon = useCart((s) => s.setCoupon)
  const clear = useCart((s) => s.clear)
  const subtotal = useCart((s) => s.subtotal())
  const discount = useCart((s) => s.discount(s.subtotal()))
  const total = useCart((s) => s.total())

  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [customer, setCustomer] = useState<CustomerForm>({
    name: '',
    phone: '',
    email: '',
    cep: '',
    address: '',
  })
  const [shippingMethod, setShippingMethod] = useState(
    settings.shipping.methods[0]?.id ?? 'correios',
  )
  const [shippingCost, setShippingCost] = useState(
    settings.shipping.methods[0]?.cost ?? 0,
  )
  const [submitting, setSubmitting] = useState(false)

  const grandTotal = total + shippingCost

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      toast.error('Informe um código de cupom.')
      return
    }
    setCouponLoading(true)
    try {
      const r = await fetch(
        `/api/coupons/${encodeURIComponent(code)}?subtotal=${subtotal}`,
      )
      const j = await r.json()
      if (j.valid && j.coupon) {
        setCoupon({
          code: j.coupon.code,
          type: j.coupon.type,
          value: j.coupon.value,
        })
        toast.success(`Cupom ${j.coupon.code} aplicado!`)
      } else {
        setCoupon(null)
        toast.error(j.reason ?? 'Cupom inválido.')
      }
    } catch {
      toast.error('Não foi possível validar o cupom.')
    } finally {
      setCouponLoading(false)
    }
  }

  const onShippingChange = (id: string) => {
    setShippingMethod(id)
    const m = settings.shipping.methods.find((x) => x.id === id)
    setShippingCost(m?.cost ?? 0)
  }

  const submit = async () => {
    if (items.length === 0) return
    if (!customer.name.trim()) {
      toast.error('Informe seu nome.')
      return
    }
    const phoneDigits = customer.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      toast.error('Informe um telefone válido com DDD.')
      return
    }
    if (!shippingMethod) {
      toast.error('Selecione o método de envio.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Cria o pedido
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email || null,
          customerCep: customer.cep || null,
          customerAddress: customer.address || null,
          items: items.map((it: CartItem) => ({
            productId: it.productId,
            productName: it.name,
            productImg: it.image,
            price: it.price,
            quantity: it.quantity,
            color: it.color?.name ?? null,
            size: it.size ?? null,
          })),
          subtotal,
          discount,
          couponCode: coupon?.code ?? null,
          shippingMethod,
          shippingCost,
          total: grandTotal,
        }),
      })
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao registrar pedido')
      }
      const orderJson = await orderRes.json()
      const orderNumber = orderJson.orderNumber as string

      // 2. Constrói a mensagem WhatsApp
      const lines: string[] = []
      lines.push('🛍️ *Novo pedido — Loja Lenora*')
      lines.push(`Pedido: *${orderNumber}*`)
      lines.push('')
      lines.push('─'.repeat(20))
      items.forEach((it: CartItem) => {
        const colorPart = it.color ? ` (${it.color.name})` : ''
        const sizePart = it.size ? ` · Tam ${it.size}` : ''
        lines.push(
          `• ${it.quantity}× ${it.name}${colorPart}${sizePart} — ${formatBRL(
            it.price * it.quantity,
          )}`,
        )
      })
      lines.push('─'.repeat(20))
      lines.push(`Subtotal: ${formatBRL(subtotal)}`)
      if (discount > 0) {
        lines.push(
          `Desconto${coupon ? ` (${coupon.code})` : ''}: - ${formatBRL(discount)}`,
        )
      }
      const shipMethod = settings.shipping.methods.find(
        (m) => m.id === shippingMethod,
      )
      lines.push(
        `Envio (${shipMethod?.label ?? shippingMethod}): ${
          shippingCost > 0 ? formatBRL(shippingCost) : 'a combinar'
        }`,
      )
      lines.push(`*TOTAL: ${formatBRL(grandTotal)}*`)
      lines.push('')
      lines.push('👤 Cliente:')
      lines.push(`Nome: ${customer.name}`)
      lines.push(`Telefone: ${customer.phone}`)
      if (customer.email) lines.push(`Email: ${customer.email}`)
      if (customer.cep) lines.push(`CEP: ${customer.cep}`)
      if (customer.address) lines.push(`Endereço: ${customer.address}`)
      lines.push('')
      lines.push('Aguardo confirmação. Obrigada! 🌸')

      const msg = encodeURIComponent(lines.join('\n'))
      const waNum = settings.contact.whatsapp.replace(/\D/g, '')
      window.open(
        `https://wa.me/${waNum}?text=${msg}`,
        '_blank',
        'noopener,noreferrer',
      )
      toast.success('Pedido enviado! A Loja Lenora receberá no WhatsApp.')
      clear()
      setCustomer({ name: '', phone: '', email: '', cep: '', address: '' })
    } catch (e) {
      toast.error((e as Error).message || 'Erro ao finalizar pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  // ───────────── Empty state ─────────────
  if (items.length === 0) {
    return (
      <div className="fade-in container-lenora flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex size-24 items-center justify-center rounded-full border border-border bg-muted"
        >
          <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
        </motion.div>
        <div>
          <h1 className="font-serif text-4xl text-foreground">Sua sacola está vazia</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Que tal explorar a nossa curadoria de peças femininas? Adicione
            seus favoritos e finalize o pedido em segundos pelo WhatsApp.
          </p>
        </div>
        <button
          onClick={() => nav({ view: 'shop' })}
          className="btn-gold inline-flex h-12 items-center gap-2 rounded-md px-7 text-sm uppercase tracking-[0.2em]"
        >
          Explorar produtos
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ───────────── Cart with items ─────────────
  return (
    <div className="fade-in container-lenora py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-2 text-center">
        <span className="text-[11px] uppercase tracking-[0.35em] text-accent">
          Checkout
        </span>
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
          Sua sacola
        </h1>
        <p className="text-sm text-muted-foreground">
          Revise seus itens e finalize o pedido pelo WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* LEFT: items + form */}
        <div className="flex flex-col gap-8">
          {/* Items */}
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <div className="border-b border-border bg-secondary/40 px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Itens ({items.length})
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 border-b border-border p-5 last:border-0"
                  >
                    <div className="img-zoom size-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:size-28">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-lg leading-tight">
                            {it.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {it.color && (
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className="size-3 rounded-full border border-border"
                                  style={{ background: it.color.hex }}
                                  aria-hidden
                                />
                                {it.color.name}
                              </span>
                            )}
                            {it.size && <span>· Tam: {it.size}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(it.id)}
                          aria-label="Remover"
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
                          <button
                            onClick={() => updateQty(it.id, it.quantity - 1)}
                            aria-label="Diminuir"
                            className="flex size-9 items-center justify-center transition-colors hover:bg-muted"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-8 text-center text-sm tabular-nums">
                            {it.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(it.id, it.quantity + 1)}
                            aria-label="Aumentar"
                            className="flex size-9 items-center justify-center transition-colors hover:bg-muted"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatBRL(it.price)} un.
                          </p>
                          <p className="font-serif text-lg tabular-nums">
                            {formatBRL(it.price * it.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* Coupon */}
          <div className="rounded-md border border-border bg-background p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <Tag className="h-3.5 w-3.5 text-accent" />
              Cupom de desconto
            </div>
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="DIGITE O CÓDIGO"
                aria-label="Código do cupom"
                className="h-11 flex-1 uppercase"
              />
              <Button
                onClick={applyCoupon}
                disabled={couponLoading}
                variant="outline"
                className="h-11 border-border px-5 text-xs uppercase tracking-widest hover:border-accent"
              >
                {couponLoading ? 'Validando…' : 'Aplicar'}
              </Button>
            </div>
            {coupon && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cupom {coupon.code} aplicado — {formatBRL(discount)} de desconto
              </p>
            )}
          </div>

          {/* Customer info form */}
          <div className="rounded-md border border-border bg-background p-5">
            <div className="mb-4 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Seus dados
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, name: e.target.value }))
                  }
                  className="h-11"
                  placeholder="Como podemos te chamar?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input
                  id="phone"
                  inputMode="numeric"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer((c) => ({
                      ...c,
                      phone: maskPhone(e.target.value),
                    }))
                  }
                  className="h-11"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, email: e.target.value }))
                  }
                  className="h-11"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP (opcional)</Label>
                <Input
                  id="cep"
                  inputMode="numeric"
                  value={customer.cep}
                  onChange={(e) =>
                    setCustomer((c) => ({
                      ...c,
                      cep: maskCep(e.target.value),
                    }))
                  }
                  className="h-11"
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Endereço (opcional)</Label>
                <Input
                  id="address"
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer((c) => ({ ...c, address: e.target.value }))
                  }
                  className="h-11"
                  placeholder="Rua, número, bairro, cidade/UF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: summary + shipping */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-md border border-border bg-background p-6">
            <h2 className="mb-4 font-serif text-2xl">Resumo do pedido</h2>

            {/* Shipping method */}
            <div className="mb-5">
              <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Forma de envio
              </p>
              <RadioGroup
                value={shippingMethod}
                onValueChange={onShippingChange}
                className="gap-2"
              >
                {settings.shipping.methods.map((m) => (
                  <label
                    key={m.id}
                    className={classNames(
                      'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-all hover:border-accent',
                      shippingMethod === m.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border',
                    )}
                  >
                    <RadioGroupItem
                      value={m.id}
                      className="mt-0.5"
                      aria-label={m.label}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{m.label}</span>
                        <span className="text-sm tabular-nums text-foreground/80">
                          {m.cost > 0 ? formatBRL(m.cost) : 'a combinar'}
                        </span>
                      </div>
                      {m.note && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {m.note}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Desconto</span>
                  <span className="tabular-nums">- {formatBRL(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envio</span>
                <span className="tabular-nums">
                  {shippingCost > 0
                    ? formatBRL(shippingCost)
                    : 'a combinar no checkout'}
                </span>
              </div>
            </div>

            <div className="gold-line my-4" />

            <div className="flex items-baseline justify-between">
              <span className="font-serif text-lg">Total</span>
              <span className="font-serif text-3xl text-accent tabular-nums">
                {formatBRL(grandTotal)}
              </span>
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="btn-gold mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm uppercase tracking-[0.2em] disabled:opacity-60"
            >
              {submitting ? 'Enviando…' : 'Finalizar Pedido no WhatsApp'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              Você será redirecionada para o WhatsApp
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-md border border-dashed border-border bg-background p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Compra protegida — confirmação direta com a Loja Lenora.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Pagamento via Pix, cartão ou boleto (combinado no WhatsApp).
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
