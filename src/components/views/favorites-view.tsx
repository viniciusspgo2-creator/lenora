// FavoritesView (Loja Lenora) — lista os produtos favoritos.
'use client'
import { motion } from 'framer-motion'
import { ArrowRight, Heart } from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import {
  ProductCard,
  type ProductCardData,
} from '@/components/product-card'

type Props = {
  settings: SiteSettings
  products: ProductCardData[]
}

export function FavoritesView({ settings, products }: Props) {
  const nav = useViewNav()

  if (products.length === 0) {
    return (
      <div className="fade-in container-lenora flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex size-24 items-center justify-center rounded-full border border-border bg-muted"
        >
          <Heart className="h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
        </motion.div>
        <div>
          <h1 className="font-serif text-4xl text-foreground">
            Você ainda não favoritou nenhum produto
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Explore nossa curadoria e toque no coração para guardar aqui
            as peças que combinam com o seu estilo.
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

  return (
    <div className="fade-in container-lenora py-10 md:py-14">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-accent">
          <Heart className="h-4 w-4" />
          Sua lista
        </span>
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
          Favoritos
        </h1>
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'peça guardada' : 'peças guardadas'}
        </p>
        <div className="gold-line w-20" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={() => nav({ view: 'shop' })}
          className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-background px-7 text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          Continuar explorando
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
