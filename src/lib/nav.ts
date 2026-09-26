// View-router client-side (Loja Lenora): como só há 1 rota real (/),
// navegamos entre "views" via query param `view`. A página lê o query e
// renderiza a view certa. Mantém scroll-to-top a cada mudança.
'use client'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export type View =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'favorites'
  | 'account'
  | 'policies'
  | 'contact'
  | 'admin'

export function useViewNav() {
  const router = useRouter()
  return useCallback(
    (opts: {
      view?: View
      slug?: string
      category?: string
      q?: string
      policy?: string
      tab?: string
      sort?: string
      minPrice?: string
      maxPrice?: string
      color?: string
      size?: string
      page?: string
    }) => {
      const params = new URLSearchParams()
      if (opts.view) params.set('view', opts.view)
      if (opts.slug) params.set('slug', opts.slug)
      if (opts.category) params.set('category', opts.category)
      if (opts.q) params.set('q', opts.q)
      if (opts.policy) params.set('policy', opts.policy)
      if (opts.tab) params.set('tab', opts.tab)
      if (opts.sort) params.set('sort', opts.sort)
      if (opts.minPrice) params.set('minPrice', opts.minPrice)
      if (opts.maxPrice) params.set('maxPrice', opts.maxPrice)
      if (opts.color) params.set('color', opts.color)
      if (opts.size) params.set('size', opts.size)
      if (opts.page) params.set('page', opts.page)
      router.push(`/?${params.toString()}`)
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [router]
  )
}
