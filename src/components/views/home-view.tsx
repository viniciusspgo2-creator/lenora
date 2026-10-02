// HomeView (Loja Lenora) — versão moderna e direta.
// Hero estilo "perfil de loja" (logo, localização, produtos, coleções, seguir),
// categorias em círculos com scroll horizontal, destaques,
// novidades, promoções e CTA final.
'use client'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Layers,
  MapPin,
  ShoppingBag,
  Truck,
  UserPlus,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { ProductCard, type ProductCardData } from '@/components/product-card'

export type CategoryData = {
  id: string
  name: string
  slug: string
  image?: string | null
}

type Props = {
  settings: SiteSettings
  featured: ProductCardData[]
  categories: CategoryData[]
  newProducts: ProductCardData[]
  onSale: ProductCardData[]
  productCount: number
  categoryCount: number
}

// Formata números grandes no padrão brasileiro (1.529.851)
function formatCount(n: number): string {
  return n.toLocaleString('pt-BR')
}

export function HomeView({
  settings,
  featured,
  categories,
  newProducts,
  onSale,
  productCount,
  categoryCount,
}: Props) {
  const nav = useViewNav()
  const catRailRef = useRef<HTMLDivElement>(null)

  // Scroll suave da trilha de categorias (botões laterais no desktop)
  const scrollCats = (dir: 1 | -1) => {
    const el = catRailRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <div className="fade-in">
      {/* ───────────────────────── HERO estilo perfil de loja ───────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        {/* Glow rosa de fundo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(219,39,119,0.10),transparent)] blur-2xl" />
        <div className="container-lenora relative py-6 md:py-10">
          {/* Bloco SEO crawlable (sr-only) — conteúdo pra Google ler o que é a loja.
              O H1 visível agora é o nome da loja no card de perfil. */}
          <div className="sr-only">
            <h1>
              Loja Lenora — Moda Feminina: cropped, blusa, body, regata, top
              canelado e tomara que caixa. Peças com curadoria, compra segura,
              envio para todo Brasil e atendimento 100% online e personalizado.
            </h1>
            <p>
              A Loja Lenora é um catálogo digital de moda feminina premium
              com curadoria de peças atemporais. Trabalhamos com as categorias:
              cropped, blusa, body, blusa canelada, regata, top canelado e
              tomara que caixa. Atendimento 100% online das 9h às 17h, envio
              para todo Brasil (Correios, transportadora, Uber/motoboy em
              Goiânia e retirada no local) e compra segura via WhatsApp.
            </p>
            <p>
              {settings.brandTagline}. Monte sua sacola e finalize o pedido
              pelo WhatsApp — a loja recebe o pedido organizado e a cliente
              pode criar conta para acompanhar o status: recebido, em
              preparação, enviado e entregue.
            </p>
          </div>

          {/* Card de perfil da loja (desktop + mobile) — sem imagem de banner */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-24px_rgba(80,7,36,0.25)]"
          >
            {/* Topo: logo + nome + localização + botão seguir */}
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-7">
              <div className="flex items-center gap-4">
                {/* Logo circular com monograma */}
                <div className="relative shrink-0">
                  <span className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#9d174d] text-2xl font-extrabold text-white shadow-[0_10px_24px_-8px_rgba(219,39,119,0.6)] sm:size-20 sm:text-3xl">
                    L
                  </span>
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-card sm:size-6"
                  >
                    <span className="size-2 rounded-full bg-accent sm:size-2.5" />
                  </motion.span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                      Loja Lenora
                    </p>
                    <BadgeCheck className="size-4 shrink-0 text-accent sm:size-5" strokeWidth={2} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                    <MapPin className="size-3.5 shrink-0 text-accent" strokeWidth={2} />
                    Goiânia • GO — Loja Online
                  </p>
                </div>
              </div>

              {/* Botão seguir (abre o Instagram da loja) */}
              <motion.a
                href={`https://instagram.com/${settings.contact.instagram?.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.96 }}
                className="btn-gold inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-[0.14em] transition-all sm:h-11 sm:px-6"
              >
                <UserPlus className="h-4 w-4" strokeWidth={2.2} />
                Seguir
              </motion.a>
            </div>

            {/* Estatísticas: produtos + coleções */}
            <div className="grid grid-cols-2 border-t border-border">
              <motion.button
                onClick={() => nav({ view: 'shop' })}
                whileTap={{ scale: 0.97 }}
                className="group flex flex-col items-center gap-0.5 py-4 transition-colors hover:bg-muted/60 sm:py-5"
              >
                <span className="flex items-center gap-1.5 text-lg font-extrabold tabular-nums sm:text-2xl">
                  {formatCount(productCount)}
                  <ShoppingBag className="size-4 text-accent transition-transform group-hover:scale-110 sm:size-5" strokeWidth={2} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
                  Produtos
                </span>
              </motion.button>
              <div className="flex flex-col items-center gap-0.5 border-l border-border py-4 sm:py-5">
                <span className="flex items-center gap-1.5 text-lg font-extrabold tabular-nums sm:text-2xl">
                  {formatCount(categoryCount)}
                  <Layers className="size-4 text-accent transition-transform group-hover:scale-110 sm:size-5" strokeWidth={2} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
                  Coleções
                </span>
              </div>
            </div>

            {/* Faixa de informações rápidas (rosa bebê) */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border bg-secondary/70 px-5 py-3.5 text-[11px] font-medium text-primary sm:justify-between sm:px-7 sm:text-xs">
              <span className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-accent" strokeWidth={2} />
                Envio para todo o Brasil
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Clock className="size-3.5 text-accent" strokeWidth={2} />
                Atendimento das 9h às 17h
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-accent" strokeWidth={2} />
                Compra segura via WhatsApp
              </span>
            </div>
          </motion.div>

          {/* CTA buttons abaixo do card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              onClick={() => nav({ view: 'shop' })}
              whileTap={{ scale: 0.96 }}
              className="btn-gold inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Explorar coleção
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => nav({ view: 'shop', sort: 'newest' })}
              whileTap={{ scale: 0.96 }}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-background px-8 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Novidades
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────── CATEGORIAS (círculos, scroll horizontal) ───────────────────────── */}
      {categories.length > 0 && (
        <section className="container-lenora py-14 md:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                Coleções
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Compre por categoria
              </h2>
            </div>
            {/* Setas de navegação (desktop) */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => scrollCats(-1)}
                aria-label="Categorias anteriores"
                className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => scrollCats(1)}
                aria-label="Próximas categorias"
                className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Trilha horizontal com scroll/deslizar — compatível com touch mobile */}
          <div className="relative">
            <div
              ref={catRailRef}
              className="flex gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {categories.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => nav({ view: 'shop', category: c.slug })}
                  className="group flex w-28 shrink-0 flex-col items-center gap-3 sm:w-32 md:w-36"
                >
                  <span className="relative size-28 shrink-0 overflow-hidden rounded-full border border-border bg-muted transition-all duration-300 group-hover:scale-[1.04] group-hover:border-accent group-hover:shadow-[0_14px_30px_-12px_rgba(219,39,119,0.4)] sm:size-32 md:size-36">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-2xl font-bold text-accent">
                        {c.name.charAt(0)}
                      </span>
                    )}
                    <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
                    {c.name}
                  </span>
                </motion.button>
              ))}
            </div>
            {/* Fade nas bordas indicando que dá pra arrastar */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-background to-transparent" />
          </div>
        </section>
      )}

      {/* ───────────────────────── PRODUTOS EM DESTAQUE ───────────────────────── */}
      {featured.length > 0 && (
        <section className="container-lenora py-14 md:py-16">
          <SectionHead kicker="Selecionados para você" title="Produtos em destaque" onAll={() => nav({ view: 'shop', sort: 'featured' })} />
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────── NOVIDADES ───────────────────────── */}
      {newProducts.length > 0 && (
        <section className="container-lenora py-14 md:py-16">
          <SectionHead kicker="Recém-chegadas" title="Novidades" onAll={() => nav({ view: 'shop', q: 'novo' })} />
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {newProducts.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────── PROMOÇÕES ───────────────────────── */}
      {onSale.length > 0 && (
        <section className="bg-secondary py-14 md:py-16">
          <div className="container-lenora">
            <SectionHead kicker="Oportunidades" title="Promoções" onAll={() => nav({ view: 'shop', q: 'promocao' })} />
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {onSale.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── CTA FINAL ───────────────────────── */}
      <section className="container-lenora pt-14 pb-16 md:pt-16 md:pb-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border-2 border-primary bg-background p-8 text-center shadow-[0_24px_60px_-24px_rgba(80,7,36,0.25)] md:p-12">
          <div className="flex flex-col items-center gap-5">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Truck className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Monte sua sacola e finalize pelo WhatsApp
            </h2>
            <p className="max-w-lg text-sm text-muted-foreground">
              Escolha suas peças favoritas, adicione à sacola e finalize em
              segundos com a confirmação pelo nosso WhatsApp.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => nav({ view: 'shop' })}
                className="btn-gold inline-flex h-12 items-center gap-2 rounded-md px-7 text-sm font-semibold uppercase tracking-[0.18em]"
              >
                Explorar produtos
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => nav({ view: 'favorites' })}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-border px-7 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Heart className="h-4 w-4" />
                Ver favoritos
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Cabeçalho de seção reutilizável (kicker + título + "ver tudo" visível)
function SectionHead({
  kicker,
  title,
  onAll,
}: {
  kicker: string
  title: string
  onAll: () => void
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
          {kicker}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      <button
        onClick={onAll}
        className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-accent bg-accent/5 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-accent transition-all hover:bg-accent hover:text-accent-foreground"
      >
        Ver tudo
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}
