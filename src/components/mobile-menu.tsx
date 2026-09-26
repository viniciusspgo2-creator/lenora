// Mobile Menu (Loja Lenora) — Sheet lateral esquerda.
// Lista categorias (mesma query do header) + links de navegação.
'use client'
import { useQuery } from '@tanstack/react-query'
import { Heart, Home, LayoutGrid, Lock, Mail, ShoppingBag, User } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useUI } from '@/lib/store-ui'
import { useViewNav } from '@/lib/nav'
import { motion } from 'framer-motion'

type Category = { id: string; name: string; slug: string }

export function MobileMenu() {
  const open = useUI((s) => s.mobileMenuOpen)
  const setOpen = useUI((s) => s.setMobileMenuOpen)
  const nav = useViewNav()

  const { data } = useQuery<{ items: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories')
      if (!r.ok) return { items: [] }
      const j = await r.json()
      return { items: (j.items as Category[]) ?? [] }
    },
    staleTime: 5 * 60 * 1000,
  })

  const categories = data?.items ?? []

  const go = (opts: Parameters<typeof nav>[0]) => {
    setOpen(false)
    nav(opts)
  }

  const mainLinks = [
    { icon: Home, label: 'Início', action: () => go({ view: 'home' }) },
    { icon: LayoutGrid, label: 'Produtos', action: () => go({ view: 'shop' }) },
    { icon: ShoppingBag, label: 'Destaques', action: () => go({ view: 'shop', sort: 'featured' }) },
    { icon: ShoppingBag, label: 'Novidades', action: () => go({ view: 'shop', sort: 'newest' }) },
    { icon: Mail, label: 'Contato', action: () => go({ view: 'contact' }) },
    { icon: Heart, label: 'Favoritos', action: () => go({ view: 'favorites' }) },
    { icon: User, label: 'Minha Conta', action: () => go({ view: 'account' }) },
    { icon: Lock, label: 'Admin', action: () => go({ view: 'admin' }) },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-[85%] gap-0 p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SheetDescription className="sr-only">
          Categorias e links principais da Loja Lenora.
        </SheetDescription>

        {/* Brand no topo */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button onClick={() => go({ view: 'home' })} className="flex items-center gap-2">
            <span className="text-2xl font-extrabold uppercase tracking-[0.2em]">Lenora</span>
            <span className="size-2 rounded-full bg-accent" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Categorias */}
          <div className="mb-6">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Coleções
            </p>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => go({ view: 'shop', category: c.slug })}
                    className="flex w-full items-center justify-between border-b border-border/50 py-3 text-lg font-semibold transition-colors hover:text-accent"
                  >
                    {c.name}
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Ver →
                    </span>
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">Sem categorias</li>
              )}
            </ul>
          </div>

          {/* Links principais */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Navegação
            </p>
            <ul className="space-y-1">
              {mainLinks.map((l) => (
                <motion.li key={l.label} whileTap={{ scale: 0.98 }}>
                  <button
                    onClick={l.action}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    <l.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    {l.label}
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">
            Moda feminina com curadoria, conforto e elegância.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
