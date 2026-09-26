// HomeView (Loja Lenora) — versão moderna e direta.
// Hero só com headline estratégica (sem imagem), marquee de trust,
// categorias em círculos com scroll horizontal, destaques, novidades,
// promoções, newsletter e CTA final. Sem editorial preto, sem
// depoimentos, sem cards de info com ícones.
'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Mail, Send, Truck } from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { ProductCard, type ProductCardData } from '@/components/product-card'
import { Input } from '@/components/ui/input'

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
}

const MARQUEE =
  'ENVIO PARA TODO BRASIL · COMPRA SEGURA · ATENDIMENTO 100% ONLINE · ATENDIMENTO PERSONALIZADO · '

export function HomeView({
  settings,
  featured,
  categories,
  newProducts,
  onSale,
}: Props) {
  const nav = useViewNav()
  const [email, setEmail] = useState('')
  const catRailRef = useRef<HTMLDivElement>(null)

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Por favor, informe um email válido.')
      return
    }
    toast.success('Inscrição confirmada!', {
      description: 'Você receberá lançamentos e ofertas exclusivas da Loja Lenora.',
    })
    setEmail('')
  }

  // Scroll suave da trilha de categorias (botões laterais no desktop)
  const scrollCats = (dir: 1 | -1) => {
    const el = catRailRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <div className="fade-in">
      {/* ───────────────────────── HERO com banner ───────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        {/* Glow dourado de fundo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,75,0.16),transparent)] blur-2xl" />
        <div className="container-lenora relative flex flex-col items-center gap-6 py-6 text-center md:py-8 lg:py-10">
          {/* H1 crawlable (sr-only) — o banner é imagem com texto, então o Google
              precisa de um H1 real em HTML. Conteúdo otimizado pra palavra-chave. */}
          <h1 className="sr-only">
            Loja Lenora — Moda Feminina: cropped, blusa, body, regata, top
            canelado e tomara que caixa. Peças com curadoria, compra segura,
            envio para todo Brasil e atendimento 100% online e personalizado.
          </h1>

          {/* Bloco SEO crawlable (sr-only) — conteúdo pra Google ler o que é a loja */}
          <div className="sr-only">
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

          {/* Banner responsivo: desktop wide / mobile quadrado, bordas arredondadas — maior possível */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full"
          >
            <div className="group relative overflow-hidden rounded-[1.25rem] border border-border bg-muted shadow-[0_30px_70px_-25px_rgba(10,10,10,0.35)] ring-1 ring-black/5 transition-all duration-500 hover:shadow-[0_30px_80px_-20px_rgba(201,162,75,0.45)] sm:rounded-[1.75rem]">
              <picture>
                {/* Mobile: imagem quadrada */}
                <source media="(max-width: 768px)" srcSet="/uploads/hero-mobile.webp" />
                {/* Desktop: imagem wide em resolução cheia (LCP) */}
                <img
                  src="/uploads/hero-desktop.webp"
                  alt="Loja Lenora — Moda Feminina · Seja Bem-vinda · Cropped, blusa, body, regata, top canelado e tomara que caixa · Enviamos para todo Brasil"
                  width={1600}
                  height={686}
                  fetchPriority="high"
                  decoding="async"
                  className="block aspect-square w-full object-cover md:aspect-[1600/686]"
                  draggable={false}
                />
              </picture>
              {/* Highlight dourado sutil no hover */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-accent/0 transition-all duration-500 group-hover:ring-accent/30" />
            </div>
          </motion.div>

          {/* CTA buttons abaixo do banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => nav({ view: 'shop' })}
              className="btn-gold inline-flex h-12 items-center gap-2 rounded-md px-8 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Explorar coleção
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => nav({ view: 'shop', sort: 'newest' })}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-background px-8 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Novidades
            </button>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────── MARQUEE STRIP ───────────────────────── */}
      <section className="overflow-hidden bg-primary text-primary-foreground">
        <div className="marquee-track py-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} aria-hidden={i > 0} className="text-accent">
              {MARQUEE}
            </span>
          ))}
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
                  onClick={() => nav({ view: 'shop', category: c.slug })}
                  className="flex w-28 shrink-0 flex-col items-center gap-3 sm:w-32 md:w-36"
                >
                  <span className="relative size-28 shrink-0 overflow-hidden rounded-full border border-border bg-muted transition-all duration-300 group-hover:border-accent group-hover:shadow-[0_14px_30px_-12px_rgba(201,162,75,0.5)] sm:size-32 md:size-36">
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

      {/* ───────────────────────── NEWSLETTER ───────────────────────── */}
      <section className="container-lenora py-14 md:py-16">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-8 md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,75,0.18),transparent)] blur-xl" />
          <div className="gold-line absolute left-0 top-0 h-full w-px" />
          <div className="relative flex flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              <Mail className="h-4 w-4" />
              Newsletter
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Receba lançamentos
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Inscreva-se para receber as novidades, ofertas exclusivas e
              looks curados pela Lenora antes de todo mundo.
            </p>
            <form
              onSubmit={subscribe}
              className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor email"
                aria-label="Email"
                className="h-12 flex-1"
              />
              <button
                type="submit"
                className="btn-gold inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold uppercase tracking-widest"
              >
                <Send className="h-4 w-4" />
                Inscrever
              </button>
            </form>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Sem spam. Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA FINAL ───────────────────────── */}
      <section className="container-lenora pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-lg border-2 border-primary bg-background p-8 text-center md:p-12">
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
                className="btn-dark inline-flex h-12 items-center gap-2 rounded-md px-7 text-sm font-semibold uppercase tracking-[0.18em]"
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
