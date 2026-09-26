// Cart Drawer (Loja Lenora) — Sheet lateral direita, controlado por useUI.
// Mostra itens, subtotal, cupom e total. Botão "Finalizar Pedido" vai para /?view=cart.
'use client'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useUI } from '@/lib/store-ui'
import { useCart } from '@/lib/store-cart'
import { useViewNav } from '@/lib/nav'
import { formatBRL } from '@/lib/utils-lenora'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const setOpen = useUI((s) => s.setCartOpen)
  const items = useCart((s) => s.items)
  const coupon = useCart((s) => s.coupon)
  const removeItem = useCart((s) => s.removeItem)
  const updateQty = useCart((s) => s.updateQty)
  const subtotal = useCart((s) => s.subtotal())
  const total = useCart((s) => s.total())
  const discount = useCart((s) => s.discount(s.subtotal()))
  const nav = useViewNav()

  // Travar scroll do body quando aberto
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <SheetTitle className="sr-only">Sua sacola</SheetTitle>
        <SheetDescription className="sr-only">
          Revise os itens da sua sacola antes de finalizar o pedido.
        </SheetDescription>

        {/* Header do drawer */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <span className="font-serif text-xl tracking-wide">Sua Sacola</span>
            <span className="ml-1 text-xs uppercase tracking-widest text-muted-foreground">
              ({items.length})
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex size-20 items-center justify-center rounded-full border border-border bg-muted"
            >
              <ShoppingBag className="h-9 w-9 text-muted-foreground" strokeWidth={1.2} />
            </motion.div>
            <div>
              <p className="font-serif text-xl">Sua sacola está vazia</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore o catálogo e escolha suas peças favoritas.
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false)
                nav({ view: 'shop' })
              }}
              className="btn-dark mt-2 inline-flex h-11 items-center justify-center rounded-md px-6 text-sm uppercase tracking-widest"
            >
              Explorar Produtos
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 border-b border-border pb-4 last:border-0"
                    >
                      <div className="img-zoom size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-serif text-base leading-tight">
                            {it.name}
                          </p>
                          <button
                            onClick={() => removeItem(it.id)}
                            aria-label="Remover"
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
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
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
                            <button
                              onClick={() => updateQty(it.id, it.quantity - 1)}
                              aria-label="Diminuir"
                              className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-sm tabular-nums">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(it.id, it.quantity + 1)}
                              aria-label="Aumentar"
                              className="flex size-8 items-center justify-center transition-colors hover:bg-muted"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="font-medium tabular-nums">
                            {formatBRL(it.price * it.quantity)}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            {/* Footer com totais */}
            <div className="space-y-3 border-t border-border bg-muted/30 px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              {coupon && discount > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>
                    Cupom {coupon.code}
                  </span>
                  <span className="tabular-nums">- {formatBRL(discount)}</span>
                </div>
              )}
              <div className="gold-line" />
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl text-accent tabular-nums">
                  {formatBRL(total)}
                </span>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  nav({ view: 'cart' })
                }}
                className="btn-gold flex h-12 w-full items-center justify-center rounded-md text-sm uppercase tracking-widest"
              >
                Finalizar Pedido
              </button>
              <button
                onClick={() => {
                  setOpen(false)
                  nav({ view: 'cart' })
                }}
                className="link-underline mx-auto block text-xs uppercase tracking-widest text-muted-foreground"
              >
                Ver sacola completa
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
