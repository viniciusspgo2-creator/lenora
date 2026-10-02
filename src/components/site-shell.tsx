// Site Shell (Loja Lenora) — wrapper client-side que envolve a view ativa.
// Renderiza a faixa de anúncio no topo, header, main com children, footer,
// e os overlays (drawers/widgets).
'use client'
import type { ReactNode } from 'react'
import type { SiteSettings } from '@/lib/settings'
import { QueryProvider } from '@/components/providers/query-provider'
import { AnnouncementBar } from '@/components/announcement-bar'
import { SiteHeader } from '@/components/site-header'
import { SearchBar } from '@/components/search-bar'
import { SiteFooter } from '@/components/site-footer'
import { CartDrawer } from '@/components/cart-drawer'
import { SearchDrawer } from '@/components/search-drawer'
import { MobileMenu } from '@/components/mobile-menu'
import { ChatbotWidget } from '@/components/chatbot-widget'
import { WhatsappFab } from '@/components/whatsapp-fab'
import { BackToTop } from '@/components/back-to-top'
import { DevDownloadZip } from '@/components/dev-download-zip'

export function SiteShell({
  settings,
  children,
}: {
  settings: SiteSettings
  children: ReactNode
}) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* Faixa deslizante — o começo de tudo, no topo absoluto do site */}
        <AnnouncementBar />
        {/* Wrapper sticky: header + barra de busca fixa */}
        <div className="sticky top-0 z-50">
          <SiteHeader settings={settings} />
          <SearchBar />
        </div>
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />

        {/* Overlays / floating UI */}
        <CartDrawer />
        <SearchDrawer />
        <MobileMenu />
        <ChatbotWidget />
        <WhatsappFab settings={settings} />
        <BackToTop />
        {/* Botão temporário de download do zip — DEV-ONLY, some no build de produção */}
        {process.env.NODE_ENV === 'development' && <DevDownloadZip />}
      </div>
    </QueryProvider>
  )
}
