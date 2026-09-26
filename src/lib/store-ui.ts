// Store UI (Loja Lenora) — controla abertura de drawers/menus flutuantes.
// Não persistido: estado puramente de sessão / interação.
'use client'
import { create } from 'zustand'

type UIState = {
  cartOpen: boolean
  searchOpen: boolean
  mobileMenuOpen: boolean
  chatOpen: boolean
  setCartOpen: (b: boolean) => void
  setSearchOpen: (b: boolean) => void
  setMobileMenuOpen: (b: boolean) => void
  setChatOpen: (b: boolean) => void
  closeAll: () => void
}

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  searchOpen: false,
  mobileMenuOpen: false,
  chatOpen: false,
  setCartOpen: (b) => set({ cartOpen: b }),
  setSearchOpen: (b) => set({ searchOpen: b }),
  setMobileMenuOpen: (b) => set({ mobileMenuOpen: b }),
  setChatOpen: (b) => set({ chatOpen: b }),
  closeAll: () =>
    set({ cartOpen: false, searchOpen: false, mobileMenuOpen: false, chatOpen: false }),
}))
