// Favoritos locais (loja para clientes não logados) — persistido.
// Quando a cliente loga, sincroniza com a tabela Favorite.
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavState = {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  set: (ids: string[]) => void
  clear: () => void
}

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      set: (ids) => set({ ids }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'lenora-favs' }
  )
)
