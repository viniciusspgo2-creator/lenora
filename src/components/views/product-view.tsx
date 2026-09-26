// ProductView (Loja Lenora) — detalhe do produto.
// Galeria (main + thumbs) | info (preço, cores, tamanhos, qty) | add to cart
// + buy via WhatsApp | accordion | trust row | relacionados.
'use client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronDown,
  Heart,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { useCart } from '@/lib/store-cart'
import { useFavorites } from '@/lib/store-favorites'
import { useUI } from '@/lib/store-ui'
import { formatBRL, classNames } from '@/lib/utils-lenora'
import {
  ProductCard,
  type ProductCardData,
} from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAt?: number | null
  featured?: boolean
  tags?: string | null
  category?: { name: string; slug: string } | null
  images?: { url: string; isMain?: boolean; order?: number }[]
  colors?: { id: string; name: string; hex: string; stock?: number }[]
  sizes?: { id: string; name: string; stock?: number }[]
  reviews?: {
    id: string
    author: string
    rating: number
    comment?: string | null
    createdAt: string
  }[]
}

type Props = {
  settings: SiteSettings
  product: ProductDetail
}

export function ProductView({ settings, product }: Props) {
  const nav = useViewNav()
  const addItem = useCart((s) => s.addItem)
  const has = useFavorites((s) => s.has(product.id))
  const toggleFav = useFavorites((s) => s.toggle)
  const setCartOpen = useUI((s) => s.setCartOpen)

  const images = useMemo(
    () =>
      [...(product.images ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [product.images],
  )

  const [activeImg, setActiveImg] = useState(0)
  const [color, setColor] = useState<any>(null)
  const [size, setSize] = useState<any>(null)
  const [qty, setQty] = useState(1)

  // Reset ao trocar de produto
  useEffect(() => {
    setActiveImg(0)
    setColor(product.colors?.[0] ?? null)
    setSize(product.sizes?.[0] ?? null)
    setQty(1)
  }, [product.id, product.colors, product.sizes])

  const hasDiscount =
    product.compareAt && product.compareAt > product.price
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAt! - product.price) / product.compareAt!) * 100,
      )
    : 0

  const addToCart = () => {
    if (product.colors && product.colors.length > 0 && !color) {
      toast.error('Selecione uma cor.')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !size) {
      toast.error('Selecione um tamanho.')
      return
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: images[0]?.url ?? '',
      color: color ? { name: color.name, hex: color.hex } : null,
      size: size ? size.name : null,
      quantity: qty,
    })
    setCartOpen(true)
    toast.success(`${product.name} adicionada à sacola!`)
  }

  const buyNow = () => {
    if (product.colors && product.colors.length > 0 && !color) {
      toast.error('Selecione uma cor.')
      return
    }
    if (product.sizes && product.sizes.length > 0 && !size) {
      toast.error('Selecione um tamanho.')
      return
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: images[0]?.url ?? '',
      color: color ? { name: color.name, hex: color.hex } : null,
      size: size ? size.name : null,
      quantity: qty,
    })
    nav({ view: 'cart' })
  }

  // Produtos relacionados (mesma categoria)
  const { data: related } = useQuery<{ items: ProductCardData[] }>({
    queryKey: ['related', product.category?.slug],
    queryFn: async () => {
      if (!product.category?.slug) return { items: [] }
      const r = await fetch(
        `/api/products?category=${product.category.slug}&pageSize=8`,
      )
      if (!r.ok) return { items: [] }
      const j = await r.json()
      const items: ProductCardData[] = (j.items ?? []).filter(
        (p: ProductCardData) => p.id !== product.id,
      )
      return { items: items.slice(0, 6) }
    },
    staleTime: 60 * 1000,
  })

  const fav = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFav(product.id)
  }

  return (
    <div className="fade-in">
      <div className="container-lenora py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <button onClick={() => nav({ view: 'home' })} className="hover:text-accent">
            Início
          </button>
          <span>/</span>
          {product.category && (
            <>
              <button
                onClick={() => nav({ view: 'shop', category: product.category!.slug })}
                className="hover:text-accent"
              >
                {product.category.name}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-foreground/80">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* ───────────────── Galeria ───────────────── */}
          <div className="flex flex-col gap-3">
            <div className="img-zoom relative aspect-[3/4] overflow-hidden rounded-md border border-border bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={images[activeImg]?.url ?? images[0]?.url}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>

              {/* Counter */}
              {images.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] tabular-nums text-white">
                  {activeImg + 1} / {images.length}
                </span>
              )}

              {/* Badges */}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {hasDiscount && discountPct > 0 && (
                  <span className="btn-gold inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-widest">
                    -{discountPct}%
                  </span>
                )}
                {product.featured && (
                  <span className="inline-flex h-6 items-center rounded-full bg-primary px-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                    Destaque
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 md:grid-cols-6">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`img-zoom aspect-square overflow-hidden rounded-md border transition-all ${
                      i === activeImg
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-border hover:border-accent'
                    }`}
                    aria-label={`Imagem ${i + 1}`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ───────────────── Info ───────────────── */}
          <div className="flex flex-col gap-5">
            {product.category?.name && (
              <span className="text-[11px] uppercase tracking-[0.35em] text-accent">
                {product.category.name}
              </span>
            )}
            <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
              {product.name}
            </h1>

            {/* Preço */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-serif text-3xl tabular-nums text-foreground">
                {formatBRL(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through tabular-nums">
                    {formatBRL(product.compareAt!)}
                  </span>
                  <Badge className="btn-gold">
                    Economia de {discountPct}%
                  </Badge>
                </>
              )}
            </div>

            {/* Descrição curta */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description.split('\n')[0]?.slice(0, 220) ?? ''}
              {product.description.length > 220 ? '…' : ''}
            </p>

            <div className="gold-line w-full" />

            {/* Cores */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    Cor
                  </span>
                  {color && (
                    <span className="text-xs text-foreground/80">
                      {color.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: any) => {
                    const active = color?.name === c.name
                    return (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setColor(c)}
                            aria-label={`Cor ${c.name}`}
                            className={classNames(
                              'size-9 rounded-full border transition-all',
                              active
                                ? 'border-accent ring-2 ring-accent/40'
                                : 'border-border hover:border-accent',
                            )}
                            style={{ background: c.hex }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{c.name}</TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tamanhos */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    Tamanho
                  </span>
                  <button
                    onClick={() => nav({ view: 'policies', policy: 'trocas' })}
                    className="link-underline text-xs text-muted-foreground hover:text-accent"
                  >
                    Tabela de medidas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: any) => {
                    const active = size?.name === s.name
                    const out = (s.stock ?? 0) <= 0
                    return (
                      <button
                        key={s.id}
                        disabled={out}
                        onClick={() => setSize(s)}
                        className={classNames(
                          'h-11 min-w-12 rounded-md border px-3 text-sm font-medium transition-all',
                          active
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-background text-foreground hover:border-accent',
                          out &&
                            'cursor-not-allowed border-border text-muted-foreground/50 line-through opacity-60 hover:border-border',
                        )}
                      >
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="flex items-center gap-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Quantidade
              </span>
              <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex size-11 items-center justify-center transition-colors hover:bg-muted"
                  aria-label="Diminuir"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
                <span className="min-w-10 text-center text-sm tabular-nums">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="flex size-11 items-center justify-center transition-colors hover:bg-muted"
                  aria-label="Aumentar"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={addToCart}
                className="btn-dark inline-flex h-12 items-center justify-center gap-2 rounded-md text-sm uppercase tracking-[0.2em]"
              >
                <ShoppingBag className="h-4 w-4" />
                Adicionar à sacola
              </button>
              <button
                onClick={fav}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border text-sm uppercase tracking-[0.2em] transition-all ${
                  has
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-foreground hover:border-accent hover:text-accent'
                }`}
              >
                <Heart
                  className={classNames('h-4 w-4', has && 'fill-accent')}
                />
                {has ? 'Favoritado' : 'Favoritar'}
              </button>
            </div>
            <button
              onClick={buyNow}
              className="btn-gold inline-flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm uppercase tracking-[0.2em]"
            >
              Comprar agora pelo WhatsApp
            </button>

            {/* Trust row */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-5 text-center">
              <div className="flex flex-col items-center gap-2 text-accent">
                <Truck className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Envio para todo Brasil
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-accent">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Compra segura
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-accent">
                <RefreshCw className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Troca facilitada
                </span>
              </div>
            </div>

            {/* Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="descricao">
                <AccordionTrigger className="text-sm uppercase tracking-widest">
                  Descrição completa
                </AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="medidas">
                <AccordionTrigger className="text-sm uppercase tracking-widest">
                  Tabela de medidas
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
                            Tamanho
                          </th>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
                            Busto
                          </th>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
                            Cintura
                          </th>
                          <th className="px-3 py-2 text-left text-xs uppercase tracking-widest text-muted-foreground">
                            Quadril
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['P', '84-88', '64-68', '90-94'],
                          ['M', '88-92', '68-72', '94-98'],
                          ['G', '92-96', '72-76', '98-102'],
                          ['GG', '96-100', '76-80', '102-106'],
                          ['EXG', '100-104', '80-84', '106-110'],
                        ].map((r) => (
                          <tr key={r[0]} className="border-t border-border">
                            {r.map((c, i) => (
                              <td
                                key={i}
                                className="px-3 py-2 text-foreground/80"
                              >
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Medidas em cm · Tabela genérica. Em caso de dúvidas, fale
                    com a gente pelo WhatsApp com seu busto, cintura e quadril.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cuidados">
                <AccordionTrigger className="text-sm uppercase tracking-widest">
                  Cuidados com a peça
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    <li>Lave à mão ou em ciclo delicado com água fria.</li>
                    <li>Não use alvejante — prefira sabão neutro.</li>
                    <li>Seque à sombra, na horizontal, sobre um cabo.</li>
                    <li>Passe a ferro em temperatura baixa, do avesso.</li>
                    <li>Não torça. Seque à sombra para conservar a cor.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Tags */}
            {product.tags && (
              <div className="flex flex-wrap items-center gap-1.5">
                {product.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] uppercase tracking-[0.35em] text-accent">
                Avaliações
              </span>
              <h2 className="font-serif text-3xl text-foreground">
                Quem comprou, compartilhou
              </h2>
              <div className="gold-line w-20" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {product.reviews.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-md border border-border bg-background p-5"
                >
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Sparkles
                        key={i}
                        className={classNames(
                          'h-3.5 w-3.5',
                          i >= r.rating && 'opacity-30',
                        )}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="font-serif text-base italic text-foreground">
                      “{r.comment}”
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase tracking-widest">
                      {r.author}
                    </span>
                    <span className="tabular-nums">
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Relacionados */}
      {related?.items && related.items.length > 0 && (
        <section className="border-t border-border bg-secondary/40 py-16">
          <div className="container-lenora">
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] uppercase tracking-[0.35em] text-accent">
                Combina com
              </span>
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
                Produtos relacionados
              </h2>
              <div className="gold-line w-20" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-6 lg:overflow-visible">
              {related.items.map((p) => (
                <div
                  key={p.id}
                  className="min-w-[60%] flex-shrink-0 sm:min-w-[260px] lg:min-w-0"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() =>
                  product.category &&
                  nav({ view: 'shop', category: product.category.slug })
                }
                variant="outline"
                className="h-11 border-border text-xs uppercase tracking-widest hover:border-accent"
              >
                Ver coleção completa
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
