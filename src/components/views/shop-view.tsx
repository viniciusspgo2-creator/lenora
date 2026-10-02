// ShopView (Loja Lenora) — listagem de produtos com filtros (sidebar) + grid +
// paginação. Em mobile, filtros dentro de um Sheet. TanStack Query para refetch.
'use client'
import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import {
  ProductCard,
  type ProductCardData,
} from '@/components/product-card'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export type CategoryData = {
  id: string
  name: string
  slug: string
}

export type ShopQuery = {
  category?: string
  q?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  color?: string
  size?: string
  page?: string
}

type Props = {
  settings: SiteSettings
  categories: CategoryData[]
  initialProducts: ProductCardData[]
  initialTotal: number
  query: ShopQuery
}

const COLORS = [
  { name: 'Preto', hex: '#0a0a0a' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Off-white', hex: '#f6f4f0' },
  { name: 'Bege', hex: '#d9c9a3' },
  { name: 'Rosa', hex: '#db2777' },
  { name: 'Caramelo', hex: '#8a5a2b' },
  { name: 'Vinho', hex: '#5e1f2e' },
  { name: 'Vermelho', hex: '#c0392b' },
  { name: 'Rosa', hex: '#e8b7c0' },
  { name: 'Verde', hex: '#3e6153' },
  { name: 'Azul-marinho', hex: '#1c2a4a' },
  { name: 'Cinza', hex: '#8a8a8a' },
]

const SIZES = ['P', 'M', 'G', 'GG', 'EXG']

const SORTS = [
  { value: 'newest', label: 'Novidades' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'featured', label: 'Destaques' },
]

// Chips de filtro rápido (topo da página de produtos)
const QUICK_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'newest', label: 'Novidades' },
  { value: 'featured', label: 'Destaques' },
] as const

const PAGE_SIZE = 12

export function ShopView({
  settings,
  categories,
  initialProducts,
  initialTotal,
  query,
}: Props) {
  const nav = useViewNav()
  const [mobileOpen, setMobileOpen] = useState(false)

  const page = Number(query.page ?? '1') || 1
  const sort = query.sort ?? 'newest'

  // Constrói a querystring para a API
  const apiQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (query.category) p.set('category', query.category)
    if (query.q) p.set('q', query.q)
    // Lançamentos e Novidades → ambos são createdAt desc na API
    const effSort = query.sort === 'lancamentos' ? 'newest' : query.sort
    if (effSort) p.set('sort', effSort)
    if (query.minPrice) p.set('minPrice', query.minPrice)
    if (query.maxPrice) p.set('maxPrice', query.maxPrice)
    if (query.color) p.set('color', query.color)
    if (query.size) p.set('size', query.size)
    p.set('page', String(page))
    p.set('pageSize', String(PAGE_SIZE))
    return p.toString()
  }, [query, page])

  // TanStack Query com initialData (preenchido pelo server-side em page.tsx)
  const { data, isLoading } = useQuery<{
    items: ProductCardData[]
    total: number
  }>({
    queryKey: ['shop', apiQuery],
    queryFn: async () => {
      const r = await fetch(`/api/products?${apiQuery}`)
      if (!r.ok) return { items: [], total: 0 }
      const j = await r.json()
      return { items: j.items ?? [], total: j.total ?? 0 }
    },
    initialData:
      page === 1
        ? { items: initialProducts, total: initialTotal }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const currentCategory = categories.find((c) => c.slug === query.category)
  const title = currentCategory?.name ?? 'Coleção'

  // Helpers de mudança de filtros
  const update = (patch: Partial<ShopQuery>) => {
    const next: ShopQuery = { ...query, ...patch }
    // mudou filtro -> volta pra página 1
    if (
      patch.category !== undefined ||
      patch.q !== undefined ||
      patch.sort !== undefined ||
      patch.minPrice !== undefined ||
      patch.maxPrice !== undefined ||
      patch.color !== undefined ||
      patch.size !== undefined
    ) {
      delete next.page
    }
    nav({ view: 'shop', ...next })
    setMobileOpen(false)
  }

  const clearFilters = () => {
    nav({ view: 'shop' })
    setMobileOpen(false)
  }

  // Sidebar de filtros
  const FilterPanel = (
    <div className="space-y-8">
      {/* Categorias */}
      <div>
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Categorias
        </h3>
        <div className="space-y-1.5">
          <button
            onClick={() => update({ category: undefined })}
            className={`link-underline w-full text-left text-sm transition-colors hover:text-accent ${
              !query.category ? 'font-medium text-accent' : 'text-foreground/85'
            }`}
          >
            Todas as categorias
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ category: c.slug })}
              className={`link-underline w-full text-left text-sm transition-colors hover:text-accent ${
                query.category === c.slug
                  ? 'font-medium text-accent'
                  : 'text-foreground/85'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Faixa de preço */}
      <div>
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Faixa de preço
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            defaultValue={query.minPrice ?? ''}
            onBlur={(e) =>
              update({ minPrice: e.target.value || undefined })
            }
            className="h-10"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            defaultValue={query.maxPrice ?? ''}
            onBlur={(e) =>
              update({ maxPrice: e.target.value || undefined })
            }
            className="h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Cores */}
      <div>
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Cores
        </h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => {
            const active = query.color === c.hex
            return (
              <button
                key={c.hex}
                onClick={() => update({ color: active ? undefined : c.hex })}
                title={c.name}
                aria-label={`Filtrar por cor ${c.name}`}
                className={`size-8 rounded-full border transition-all ${
                  active
                    ? 'border-accent ring-2 ring-accent/40'
                    : 'border-border hover:border-accent'
                }`}
                style={{ background: c.hex }}
              />
            )
          })}
        </div>
        {query.color && (
          <button
            onClick={() => update({ color: undefined })}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
          >
            <X className="h-3 w-3" /> Limpar cor
          </button>
        )}
      </div>

      <Separator />

      {/* Tamanhos */}
      <div>
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Tamanhos
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const active = query.size === s
            return (
              <button
                key={s}
                onClick={() => update({ size: active ? undefined : s })}
                className={`h-10 min-w-11 rounded-md border px-3 text-sm font-medium transition-all ${
                  active
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-background text-foreground hover:border-accent'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Ordenar */}
      <div>
        <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Ordenar por
        </h3>
        <Select value={sort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        onClick={clearFilters}
        className="h-10 w-full border-border text-xs uppercase tracking-widest hover:border-accent"
      >
        Limpar filtros
      </Button>
    </div>
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container-lenora flex flex-col gap-4 py-10 md:py-14">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            Loja
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'produto' : 'produtos'}
            {query.q && ` · "${query.q}"`}
          </p>
        </div>
      </section>

      {/* Chips de filtro rápido */}
      <section className="border-b border-border bg-background">
        <div className="container-lenora flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_FILTERS.map((f) => {
            const isActive =
              f.value === ''
                ? !query.sort || query.sort === 'newest'
                : query.sort === f.value
            return (
              <button
                key={f.value || 'todos'}
                onClick={() => update({ sort: f.value || 'newest' })}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-background text-foreground/80 hover:border-accent hover:text-accent'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="container-lenora py-10">
        <div className="flex gap-8">
          {/* Sidebar desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pb-10 pr-2">
              {FilterPanel}
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1">
            {/* Topbar mobile: botão filtros + sort */}
            <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
              <Button
                variant="outline"
                onClick={() => setMobileOpen(true)}
                className="h-11 gap-2 border-border px-4 text-xs uppercase tracking-widest"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
              <Select value={sort} onValueChange={(v) => update({ sort: v })}>
                <SelectTrigger className="h-11 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid de produtos */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] animate-pulse rounded-md border border-border bg-muted"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-background px-6 py-24 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="h-7 w-7" />
                </span>
                <h3 className="font-serif text-2xl">Nenhum produto encontrado</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Tente ajustar os filtros ou explorar outra categoria. Nossa
                  curadoria está sempre atualizando.
                </p>
                <Button
                  onClick={clearFilters}
                  className="btn-gold h-11 px-6 text-xs uppercase tracking-widest"
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3"
              >
                {products.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => update({ page: String(Math.max(1, page - 1)) })}
                  disabled={page <= 1}
                  className="flex size-10 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-accent disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1
                  const isActive = p === page
                  // Mostra no máx 7 páginas com elipses
                  if (
                    totalPages > 7 &&
                    p !== 1 &&
                    p !== totalPages &&
                    (p < page - 2 || p > page + 2)
                  ) {
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span
                          key={p}
                          className="px-2 text-muted-foreground"
                        >
                          …
                        </span>
                      )
                    }
                    return null
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => update({ page: String(p) })}
                      className={`flex size-10 items-center justify-center rounded-md border text-sm tabular-nums transition-all ${
                        isActive
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-border bg-background hover:border-accent'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() =>
                    update({ page: String(Math.min(totalPages, page + 1)) })
                  }
                  disabled={page >= totalPages}
                  className="flex size-10 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-accent disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheet filtros mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Filtros</SheetTitle>
          <SheetDescription className="sr-only">
            Filtre os produtos por categoria, preço, cor e tamanho.
          </SheetDescription>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="flex items-center gap-2 font-serif text-xl">
              <Filter className="h-5 w-5 text-accent" />
              Filtros
            </span>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="px-5 py-5">{FilterPanel}</div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
