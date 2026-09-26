// Loja Lenora — Admin Shell.
// Layout: sidebar preta fixa (desktop) + bottom tab bar (mobile) + área de conteúdo.
// Top bar: marca + "Voltar à loja" + "Sair".
'use client'
import { useState, type ReactNode } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Ticket,
  ClipboardList,
  Wallet,
  Truck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Menu,
  X,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { toast } from 'sonner'
import { AdminDashboard } from './admin-dashboard'
import { AdminProducts } from './admin-products'
import { AdminCategories } from './admin-categories'
import { AdminCoupons } from './admin-coupons'
import { AdminOrders } from './admin-orders'
import { AdminFinance } from './admin-finance'
import { AdminSuppliers } from './admin-suppliers'
import { AdminCustomers } from './admin-customers'
import { AdminVisits } from './admin-visits'
import { AdminSettings } from './admin-settings'
import type { AdminTab } from './admin-app'

type NavItem = {
  id: AdminTab
  label: string
  icon: typeof LayoutDashboard
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'coupons', label: 'Cupons', icon: Ticket },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'finance', label: 'Financeiro', icon: Wallet },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'visits', label: 'Visitas', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

async function logout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' })
  } catch {
    /* ignore */
  }
  toast.success('Você saiu do painel.')
  setTimeout(() => {
    window.location.href = '/?view=home'
  }, 300)
}

export function AdminShell({
  settings,
  tab,
}: {
  settings: SiteSettings
  tab: AdminTab
}) {
  const nav = useViewNav()
  const [mobileOpen, setMobileOpen] = useState(false)

  function go(next: AdminTab) {
    setMobileOpen(false)
    nav({ view: 'admin', tab: next })
  }

  function renderTab(): ReactNode {
    switch (tab) {
      case 'dashboard':
        return <AdminDashboard settings={settings} />
      case 'products':
        return <AdminProducts settings={settings} />
      case 'categories':
        return <AdminCategories />
      case 'coupons':
        return <AdminCoupons />
      case 'orders':
        return <AdminOrders />
      case 'finance':
        return <AdminFinance settings={settings} />
      case 'suppliers':
        return <AdminSuppliers settings={settings} />
      case 'customers':
        return <AdminCustomers settings={settings} />
      case 'visits':
        return <AdminVisits />
      case 'settings':
        return <AdminSettings settings={settings} />
      default:
        return <AdminDashboard settings={settings} />
    }
  }

  const activeLabel =
    NAV.find((n) => n.id === tab)?.label ?? 'Dashboard'

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-64 shrink-0 flex-col bg-primary text-primary-foreground md:flex">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <a
            href="/?view=home"
            className="flex items-center gap-2 transition hover:opacity-90"
          >
            <span className="font-serif text-2xl tracking-[0.18em]">
              LENORA
            </span>
            <span className="size-1.5 rounded-full bg-accent" />
          </a>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-accent-foreground/80" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <a
            href="/?view=home"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <Store className="size-4" />
            Voltar à loja
          </a>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            {/* hamburger mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-md text-foreground hover:bg-muted md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Painel · Lenora
              </p>
              <h1 className="font-serif text-xl leading-tight">
                {activeLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/?view=home"
              className="hidden h-10 items-center gap-2 rounded-md border border-border px-4 text-xs uppercase tracking-[0.2em] transition hover:border-accent hover:text-accent sm:inline-flex"
            >
              <Store className="size-4" />
              Voltar à loja
            </a>
            <button
              onClick={() => logout()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{renderTab()}</main>

        {/* BOTTOM TAB BAR (mobile) */}
        <nav className="sticky bottom-0 z-30 flex items-stretch overflow-x-auto border-t border-border bg-surface md:hidden">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`flex min-w-[68px] flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium uppercase tracking-wide transition ${
                  active
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-5" />
                {item.label.slice(0, 6)}
              </button>
            )
          })}
        </nav>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-primary text-primary-foreground">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <span className="font-serif text-2xl tracking-[0.18em]">
                LENORA
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="grid size-10 place-items-center rounded text-white/80 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((item) => {
                const Icon = item.icon
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition ${
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="border-t border-white/10 p-3">
              <a
                href="/?view=home"
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <Store className="size-4" />
                Voltar à loja
              </a>
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
