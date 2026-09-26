// Store do carrinho (Loja Lenora) — persistido em localStorage.
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string // productId+color+size
  productId: string
  slug: string
  name: string
  price: number
  image: string
  color: { name: string; hex: string } | null
  size: string | null
  quantity: number
  stock?: number
}

type CartState = {
  items: CartItem[]
  coupon: { code: string; type: 'percent' | 'fixed'; value: number } | null
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  setCoupon: (c: CartState['coupon']) => void
  subtotal: () => number
  discount: (subtotal: number) => number
  total: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (item) =>
        set((state) => {
          const id = `${item.productId}|${item.color?.name ?? '-'}|${item.size ?? '-'}`
          const existing = state.items.find((i) => i.id === id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { ...item, id, quantity: item.quantity ?? 1 },
            ],
          }
        }),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (c) => set({ coupon: c }),
      subtotal: () => get().items.reduce((a, i) => a + i.price * i.quantity, 0),
      discount: (subtotal) => {
        const c = get().coupon
        if (!c) return 0
        if (c.type === 'percent') return (subtotal * c.value) / 100
        return Math.min(c.value, subtotal)
      },
      total: () => {
        const sub = get().subtotal()
        return Math.max(0, sub - get().discount(sub))
      },
      count: () => get().items.reduce((a, i) => a + i.quantity, 0),
    }),
    { name: 'lenora-cart' }
  )
)
