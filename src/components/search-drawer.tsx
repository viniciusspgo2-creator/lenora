// Search Drawer (Loja Lenora) — Dialog no topo, controlado por useUI.
// Busca debounced em /api/products?q=...&pageSize=6 e lista resultados.
'use client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUI } from '@/lib/store-ui'
import { useViewNav } from '@/lib/nav'
import { formatBRL } from '@/lib/utils-lenora'
import { motion, AnimatePresence } from 'framer-motion'

type SearchProduct = {
  id: string
  name: string
  slug: string
  price: number
  compareAt?: number | null
  category?: { name: string; slug: string } | null
  images?: { url: string; isMain: boolean }[]
}

const POPULAR = ['Vestidos', 'Calças', 'Promoções']

export function SearchDrawer() {
  const open = useUI((s) => s.searchOpen)
  const setOpen = useUI((s) => s.setSearchOpen)
  const nav = useViewNav()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setQ('')
      setDebounced('')
    }
  }, [open])

  const { data, isFetching } = useQuery<{ items: SearchProduct[] }>({
    queryKey: ['search', debounced],
    queryFn: async () => {
      if (!debounced) return { items: [] }
      const r = await fetch(
        `/api/products?q=${encodeURIComponent(debounced)}&pageSize=6`
      )
      if (!r.ok) return { items: [] }
      const j = await r.json()
      return { items: (j.items as SearchProduct[]) ?? [] }
    },
    enabled: open && debounced.length > 1,
  })

  const results = useMemo(() => data?.items ?? [], [data])

  const pick = (slug: string) => {
    setOpen(false)
    nav({ view: 'product', slug })
  }

  const pickChip = (term: string) => {
    setQ(term)
    setDebounced(term)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[10vh] max-h-[80vh] gap-0 overflow-hidden rounded-2xl border-border p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Buscar produtos</DialogTitle>
        <DialogDescription className="sr-only">
          Encontre peças do catálogo pelo nome, categoria ou descrição.
        </DialogDescription>

        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-accent" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por peça, cor, categoria..."
            className="flex-1 bg-transparent font-serif text-lg outline-none placeholder:text-muted-foreground/70"
          />
          {isFetching && (
            <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chips + Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {/* Popular chips quando sem query */}
          {!debounced && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Buscas populares
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((c) => (
                  <button
                    key={c}
                    onClick={() => pickChip(c)}
                    className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de resultados */}
          {debounced && (
            <>
              {results.length === 0 && !isFetching ? (
                <div className="py-12 text-center">
                  <p className="font-serif text-xl">Nenhum resultado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tente outro termo ou explore o catálogo completo.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {results.map((p) => {
                      const img = p.images?.find((i) => i.isMain)?.url ?? p.images?.[0]?.url
                      return (
                        <motion.li
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <button
                            onClick={() => pick(p.slug)}
                            className="group flex w-full items-center gap-4 rounded-lg border border-transparent p-2 text-left transition-all hover:border-border hover:bg-muted/40"
                          >
                            <div className="img-zoom size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              {img ? (
                                <img
                                  src={img}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                  <Search className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-serif text-base leading-tight">
                                {p.name}
                              </p>
                              {p.category?.name && (
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                  {p.category.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium tabular-nums">
                                {formatBRL(p.price)}
                              </p>
                              {p.compareAt && p.compareAt > p.price && (
                                <p className="text-xs text-muted-foreground line-through tabular-nums">
                                  {formatBRL(p.compareAt)}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-accent" />
                          </button>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
