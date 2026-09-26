// Site Header (Loja Lenora) — sticky premium, glass, com navegação central.
// Cart badge sempre visível: total R$ + item count. Reativo via useCart.
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Lock,
  Menu,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { useCart } from '@/lib/store-cart'
import { useFavorites } from '@/lib/store-favorites'
import { useUI } from '@/lib/store-ui'
import { formatBRL } from '@/lib/utils-lenora'

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const nav = useViewNav()

  // Cart reactive state
  const total = useCart((s) => s.total())
  const count = useCart((s) => s.count())
  const favCount = useFavorites((s) => s.ids.length)

  const setCartOpen = useUI((s) => s.setCartOpen)
  const setSearchOpen = useUI((s) => s.setSearchOpen)
  const setMobileMenuOpen = useUI((s) => s.setMobileMenuOpen)

  // Mount + scroll listener
  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goHome = () => nav({ view: 'home' })

  return (
    <header
      className={`border-b border-border transition-all duration-300 ${
        scrolled
          ? 'glass shadow-[0_8px_30px_-12px_rgba(10,10,10,0.15)]'
          : 'bg-background'
      }`}
    >
      <div
        className={`container-lenora flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'py-2.5' : 'py-3 md:py-5'
        }`}
      >
        {/* LEFT: hamburger + logo */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted lg:hidden"
          >
            <Menu className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
          </button>
          <button
            onClick={goHome}
            aria-label={settings.brandName}
            className="group flex items-baseline gap-1"
          >
            <span className="text-xl font-extrabold uppercase tracking-[0.2em] leading-none md:text-2xl md:tracking-[0.3em]">
              Lenora
            </span>
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="size-1.5 rounded-full bg-accent md:size-2"
            />
          </button>
        </div>

        {/* CENTER: nav desktop — menu fixo enxuto */}
        <nav className="hidden items-center gap-1 lg:flex">
          {([
            { label: 'Início', action: () => goHome() },
            { label: 'Produtos', action: () => nav({ view: 'shop' }) },
            { label: 'Destaques', action: () => nav({ view: 'shop', sort: 'featured' }) },
            { label: 'Novidades', action: () => nav({ view: 'shop', sort: 'newest' }) },
            { label: 'Contato', action: () => nav({ view: 'contact' }) },
          ] as const).map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/90 transition-colors hover:bg-muted hover:text-accent"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* RIGHT: actions */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted sm:size-11"
          >
            <Search className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={2} />
          </button>

          {/* Favorites with count */}
          <button
            onClick={() => nav({ view: 'favorites' })}
            aria-label="Favoritos"
            className="relative flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted sm:size-11"
          >
            <Heart className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={2} />
            {mounted && favCount > 0 && (
              <span className="absolute -right-0 -top-0 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {favCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={() => nav({ view: 'account' })}
            aria-label="Minha conta"
            className="hidden size-11 items-center justify-center rounded-md transition-colors hover:bg-muted sm:flex"
          >
            <User className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Admin */}
          <button
            onClick={() => nav({ view: 'admin' })}
            aria-label="Painel administrativo"
            className="hidden size-11 items-center justify-center rounded-md transition-colors hover:bg-muted md:flex"
          >
            <Lock className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Cart button — total badge sempre visível */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Abrir sacola"
            className="group relative flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 transition-all hover:border-accent sm:h-11 sm:px-3"
          >
            <div className="relative flex size-5 items-center justify-center">
              <ShoppingBag className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" strokeWidth={2} />
              {mounted && count > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </div>
            <span className="hidden text-xs font-semibold tabular-nums text-foreground sm:inline">
              {formatBRL(mounted ? total : 0)}
            </span>
          </button>
        </div>
      </div>

      {/* Linha dourada decorativa embaixo */}
      {scrolled && (
        <motion.div
          layout
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4 }}
          className="gold-line h-px origin-left"
        />
      )}
    </header>
  )
}
