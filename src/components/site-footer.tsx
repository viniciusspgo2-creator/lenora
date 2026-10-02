// Site Footer (Loja Lenora) — tons de rosa claro: marquee rosa bebê +
// 4 colunas + trust badges + bottom bar, tudo em fundo claro.
'use client'
import { Clock, Instagram, Mail, Phone } from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { maskPhone } from '@/lib/utils-lenora'

const MARQUEE = 'ENVIO PARA TODO O BRASIL · ATENDIMENTO PELO WHATSAPP · LOJA ONLINE · GOIÂNIA/GO · COMPRA SEGURA · ATENDIMENTO PERSONALIZADO · '

const POLICIES: { label: string; policy: string }[] = [
  { label: 'Trocas e Devoluções', policy: 'trocas' },
  { label: 'Política de Vendas', policy: 'vendas' },
  { label: 'Termos de Uso', policy: 'termos' },
  { label: 'Privacidade', policy: 'privacidade' },
  { label: 'Cookies', policy: 'cookies' },
]

// Small inline SVG trust badge icons (gold stroke)
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  )
}
function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M4 13a8 8 0 0116 0" strokeLinecap="round" />
      <rect x="3" y="13" width="3" height="6" rx="1.5" />
      <rect x="18" y="13" width="3" height="6" rx="1.5" />
      <path d="M19 19v1a3 3 0 01-3 3h-3" strokeLinecap="round" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" strokeLinejoin="round" />
    </svg>
  )
}

// Mini payment badges
function VisaBadge() {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-border bg-background px-2 text-[10px] font-semibold italic text-foreground">
      VISA
    </span>
  )
}
function MasterBadge() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-1.5">
      <span className="size-3 rounded-full bg-red-500/80" />
      <span className="-ml-2 size-3 rounded-full bg-yellow-500/80" />
    </span>
  )
}
function PixBadge() {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-border bg-background px-2 text-[10px] font-semibold text-foreground">
      PIX
    </span>
  )
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const nav = useViewNav()
  const year = new Date().getFullYear()
  const phone = settings.contact.phone
  const masked = maskPhone(phone)
  const instagram = settings.contact.instagram?.replace(/^@/, '')
  const whatsappNum = settings.contact.whatsapp?.replace(/\D/g, '')

  const trust = [
    { icon: HeadsetIcon, label: 'Atendimento 100% Online' },
    { icon: ShieldIcon, label: 'Compra Segura' },
    { icon: TruckIcon, label: 'Envio Rápido para Todo Brasil' },
    { icon: SparkleIcon, label: 'Atendimento Personalizado' },
  ]

  return (
    <footer className="mt-auto bg-secondary/50 text-foreground">
      {/* Marquee de mensagens premium (rosa principal, texto branco) */}
      <div className="overflow-hidden bg-accent text-accent-foreground">
        <div className="marquee-track py-2.5 text-[11px] font-semibold uppercase tracking-[0.3em]">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} aria-hidden={i > 0}>
              {MARQUEE}
            </span>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-b border-border">
        <div className="container-lenora grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
          {trust.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-3 text-accent transition-all duration-300 hover:-translate-y-0.5 hover:text-primary"
            >
              <t.icon />
              <span className="text-xs uppercase tracking-widest text-foreground/75 transition-colors">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Colunas principais */}
      <div className="container-lenora grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Col 1 — brand */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-3xl uppercase tracking-[0.3em] text-foreground">Lenora</span>
            <span className="size-2 rounded-full bg-accent" />
          </div>
          <p className="max-w-xs font-serif text-base italic text-muted-foreground">
            {settings.brandTagline}
          </p>
          <div className="gold-line w-20" />
        </div>

        {/* Col 2 — Atendimento */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-accent">Atendimento</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={`tel:+${phone}`}
                className="flex items-center gap-3 text-foreground/75 transition-colors hover:text-accent"
              >
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                {masked}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${settings.contact.email}`}
                className="flex items-center gap-3 text-foreground/75 transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                {settings.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground/75 transition-colors hover:text-accent"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
                @{instagram}
              </a>
            </li>
            <li className="flex items-center gap-3 text-foreground/75">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
              {settings.contact.hours}
            </li>
          </ul>
        </div>

        {/* Col 3 — Navegação */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-accent">Navegação</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                onClick={() => nav({ view: 'home' })}
                className="link-underline text-foreground/75 transition-colors hover:text-accent"
              >
                Início
              </button>
            </li>
            <li>
              <button
                onClick={() => nav({ view: 'shop' })}
                className="link-underline text-foreground/75 transition-colors hover:text-accent"
              >
                Loja
              </button>
            </li>
            <li>
              <button
                onClick={() => nav({ view: 'favorites' })}
                className="link-underline text-foreground/75 transition-colors hover:text-accent"
              >
                Favoritos
              </button>
            </li>
            <li>
              <button
                onClick={() => nav({ view: 'account' })}
                className="link-underline text-foreground/75 transition-colors hover:text-accent"
              >
                Minha Conta
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4 — Políticas */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-accent">Políticas</h3>
          <ul className="space-y-2.5 text-sm">
            {POLICIES.map((p) => (
              <li key={p.policy}>
                <button
                  onClick={() => nav({ view: 'policies', policy: p.policy })}
                  className="link-underline text-foreground/75 transition-colors hover:text-accent"
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center rounded-md border border-accent px-4 text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-background/70">
        <div className="container-lenora flex flex-col items-center justify-between gap-4 py-5 text-xs text-muted-foreground md:flex-row">
          <p>
            © {year} Loja Lenora. CNPJ 00.000.000/0001-00 · {settings.contact.hours}
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-2 uppercase tracking-widest text-muted-foreground/80">
              Pagamento
            </span>
            <VisaBadge />
            <MasterBadge />
            <PixBadge />
          </div>
        </div>
      </div>
    </footer>
  )
}
