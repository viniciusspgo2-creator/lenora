// Loja Lenora — Admin App (root).
// Decida entre tela de login (cookie inválido) ou painel (cookie válido).
// Tudo dentro de `?view=admin&tab=<tab>`. NÃO usa o SiteShell — vê o QueryProvider
// direto via page.tsx.
'use client'
import { useEffect, useState } from 'react'
import type { SiteSettings } from '@/lib/settings'
import { AdminLogin } from './admin-login'
import { AdminShell } from './admin-shell'

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'finance'
  | 'suppliers'
  | 'customers'
  | 'visits'
  | 'settings'

export const ADMIN_TAB_LABELS: Record<AdminTab, string> = {
  dashboard: 'Dashboard',
  products: 'Produtos',
  categories: 'Categorias',
  coupons: 'Cupons',
  orders: 'Pedidos',
  finance: 'Financeiro',
  suppliers: 'Fornecedores',
  customers: 'Clientes',
  visits: 'Visitas',
  settings: 'Configurações',
}

type AuthState = 'checking' | 'authed' | 'unauth'

export function AdminApp({
  settings,
  tab,
}: {
  settings: SiteSettings
  tab?: string
}) {
  const [auth, setAuth] = useState<AuthState>('checking')

  // Verifica cookie admin consultando um endpoint protegido.
  // Se 401, mostra login.
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/visits', { cache: 'no-store' })
      .then((r) => {
        if (cancelled) return
        if (r.ok) setAuth('authed')
        else setAuth('unauth')
      })
      .catch(() => !cancelled && setAuth('unauth'))
    return () => {
      cancelled = true
    }
  }, [])

  // Sanitiza o tab atual.
  const validTabs: AdminTab[] = [
    'dashboard',
    'products',
    'categories',
    'coupons',
    'orders',
    'finance',
    'suppliers',
    'customers',
    'visits',
    'settings',
  ]
  const current: AdminTab = validTabs.includes(tab as AdminTab)
    ? (tab as AdminTab)
    : 'dashboard'

  if (auth === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3">
          <span className="size-2.5 animate-pulse rounded-full bg-accent" />
          <span className="font-serif text-2xl tracking-[0.18em]">
            LENORA
          </span>
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Verificando acesso…
        </p>
      </div>
    )
  }

  if (auth === 'unauth') {
    return <AdminLogin brand={settings.brandName} />
  }

  return <AdminShell settings={settings} tab={current} />
}
