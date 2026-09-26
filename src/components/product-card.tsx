// ProductCard (Loja Lenora) — card premium reutilizável para grade de produtos.
// Imagem aspect-[3/4] com img-zoom, badge (Novo / -X% / Destaque), botão de
// favorito (canto sup. direito) e overlay "Ver produto" no hover.
// Navega para `?view=product&slug=<slug>` ao clicar.
'use client'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { useViewNav } from '@/lib/nav'
import { useFavorites } from '@/lib/store-favorites'
import { formatBRL, classNames } from '@/lib/utils-lenora'

export type ProductCardData = {
  id: string
  name: string
  slug: string
  price: number
  compareAt?: number | null
  featured?: boolean
  images?: { url: string; isMain?: boolean }[]
  colors?: { name: string; hex: string }[]
  sizes?: { name: string }[]
  category?: { name: string; slug: string } | null
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const nav = useViewNav()
  const has = useFavorites((s) => s.has(product.id))
  const toggle = useFavorites((s) => s.toggle)

  const mainImg =
    product.images?.find((i) => i.isMain)?.url ?? product.images?.[0]?.url ?? ''
  const altImg = product.images?.[1]?.url

  const hasDiscount =
    product.compareAt && product.compareAt > product.price
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAt! - product.price) / product.compareAt!) * 100,
      )
    : 0

  const isFeatured = product.featured

  const go = () => nav({ view: 'product', slug: product.slug })

  const fav = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    toggle(product.id)
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={go}
      className="card-product group relative flex cursor-pointer flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') go()
      }}
    >
      {/* Image */}
      <div className="img-zoom relative aspect-[3/4] overflow-hidden bg-muted">
        {mainImg ? (
          <>
            <img
              src={mainImg}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
              loading="lazy"
            />
            {altImg && (
              <img
                src={altImg}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Sparkles className="h-8 w-8" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {hasDiscount && discountPct > 0 && (
            <span className="btn-gold inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-widest">
              -{discountPct}%
            </span>
          )}
          {isFeatured && (
            <span className="inline-flex h-6 items-center rounded-full bg-primary px-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
              Destaque
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={fav}
          aria-label={has ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={has}
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm backdrop-blur transition-all hover:border-accent hover:text-accent"
        >
          <Heart
            className={classNames(
              'h-4 w-4 transition-all',
              has && 'fill-accent text-accent',
            )}
            strokeWidth={1.6}
          />
        </button>

        {/* "Ver produto" overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 items-center justify-center bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white backdrop-blur">
            Ver produto
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category?.name && (
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="font-serif text-lg leading-tight text-foreground line-clamp-2">
          {product.name}
        </h3>

        {/* Color dots */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((c, i) => (
              <span
                key={`${c.hex}-${i}`}
                className="size-3 rounded-full border border-border"
                style={{ background: c.hex }}
                aria-label={c.name}
                title={c.name}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-medium tabular-nums text-foreground">
            {formatBRL(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatBRL(product.compareAt!)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
