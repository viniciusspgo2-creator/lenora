// Loja Lenora — Admin Settings.
// Painel de configurações do site. Seções: Identidade, Cores (com
// color picker live preview), Contato, Envio (métodos editáveis), SEO,
// Admin (trocar senha). Cada seção tem seu próprio botão Salvar.
'use client'
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Save,
  Loader2,
  Palette,
  User,
  Phone,
  Truck,
  Globe,
  KeyRound,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

const COLOR_KEYS: { key: keyof SiteSettings['colors']; label: string }[] = [
  { key: 'bg', label: 'Fundo' },
  { key: 'surface', label: 'Cards / Surface' },
  { key: 'text', label: 'Texto' },
  { key: 'textMuted', label: 'Texto suave' },
  { key: 'primary', label: 'Primária (preto)' },
  { key: 'primaryForeground', label: 'Texto sobre primária' },
  { key: 'accent', label: 'Dourado' },
  { key: 'accentForeground', label: 'Texto sobre dourado' },
  { key: 'border', label: 'Bordas' },
]

export function AdminSettings({ settings }: { settings: SiteSettings }) {
  // Estado local — começa com o settings inicial (vindo do server).
  const [brandName, setBrandName] = useState(settings.brandName)
  const [brandTagline, setBrandTagline] = useState(settings.brandTagline)
  const [colors, setColors] = useState(settings.colors)
  const [contact, setContact] = useState(settings.contact)
  const [shipping, setShipping] = useState(settings.shipping)
  const [seo, setSeo] = useState(settings.seo)
  const [adminPassword, setAdminPassword] = useState('')

  // Atualiza estado quando settings muda (após salvar via invalidação).
  useEffect(() => {
    setBrandName(settings.brandName)
    setBrandTagline(settings.brandTagline)
    setColors(settings.colors)
    setContact(settings.contact)
    setShipping(settings.shipping)
    setSeo(settings.seo)
  }, [settings])

  // Mutation genérico para PUT settings.
  const putMut = useMutation({
    mutationFn: async (patch: Partial<SiteSettings>) => {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao salvar')
      return data.settings as SiteSettings
    },
    onSuccess: (s: SiteSettings) => {
      setBrandName(s.brandName)
      setBrandTagline(s.brandTagline)
      setColors(s.colors)
      setContact(s.contact)
      setShipping(s.shipping)
      setSeo(s.seo)
      toast.success('Configurações salvas. 🌸')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const saveIdentity = () =>
    putMut.mutate({ brandName: brandName.trim(), brandTagline: brandTagline.trim() })
  const saveColors = () => putMut.mutate({ colors })
  const saveContact = () => putMut.mutate({ contact })
  const saveShipping = () => putMut.mutate({ shipping })
  const saveSeo = () => putMut.mutate({ seo })
  const saveAdmin = () => {
    if (!adminPassword.trim()) {
      toast.error('Digite a nova senha.')
      return
    }
    putMut.mutate(
      { admin: { password: adminPassword.trim() } },
      {
        onSuccess: () => {
          setAdminPassword('')
          toast.success('Senha admin atualizada. Faça login novamente na próxima vez.')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Painel
          </p>
          <h2 className="font-serif text-2xl">Configurações</h2>
        </div>
        {putMut.isPending && (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Salvando…
          </span>
        )}
      </div>

      {/* IDENTIDADE */}
      <Section
        icon={User}
        title="Identidade"
        desc="Marca e tagline exibidas no storefront."
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Nome da marca
            </Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="h-11"
              placeholder="Loja Lenora"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Tagline
            </Label>
            <Input
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              className="h-11"
              placeholder="Moda feminina com curadoria"
            />
          </div>
        </div>
        <SaveBar onClick={saveIdentity} loading={putMut.isPending} />
      </Section>

      {/* CORES */}
      <Section
        icon={Palette}
        title="Cores"
        desc="Cores institucionais. Mudanças só refletem no storefront após recarregar a página (cache de 30s)."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_KEYS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
            >
              <label
                className="relative grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md border border-border"
                style={{ background: colors[key] }}
              >
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [key]: e.target.value }))
                  }
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  aria-label={label}
                />
                <Eye className="size-4 text-white/80 mix-blend-difference" />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <Input
                  value={colors[key]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [key]: e.target.value }))
                  }
                  className="mt-1 h-9 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        {/* PREVIEW */}
        <div className="mt-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </p>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: colors.border, background: colors.bg }}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: colors.primary,
                color: colors.primaryForeground,
              }}
            >
              <span
                className="font-serif text-xl tracking-[0.15em]"
                style={{ color: colors.primaryForeground }}
              >
                LENORA
              </span>
              <span
                className="rounded px-3 py-1 text-[10px] uppercase tracking-wider"
                style={{
                  background: colors.accent,
                  color: colors.accentForeground,
                }}
              >
                Comprar
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-md p-3"
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    className="mb-2 h-12 rounded"
                    style={{ background: colors.accent }}
                  />
                  <p
                    className="text-xs font-medium"
                    style={{ color: colors.text }}
                  >
                    Produto {i + 1}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: colors.textMuted }}
                  >
                    R$ 199,00
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SaveBar onClick={saveColors} loading={putMut.isPending} />
      </Section>

      {/* CONTATO */}
      <Section
        icon={Phone}
        title="Contato"
        desc="Telefones, e-mail e redes sociais exibidos no rodapé e WhatsApp FAB."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Telefone (com DDD)">
            <Input
              value={contact.phone}
              onChange={(e) =>
                setContact((c) => ({ ...c, phone: e.target.value }))
              }
              className="h-11"
              placeholder="62993220950"
            />
          </Field>
          <Field label="WhatsApp (formato internacional sem +)">
            <Input
              value={contact.whatsapp}
              onChange={(e) =>
                setContact((c) => ({ ...c, whatsapp: e.target.value }))
              }
              className="h-11"
              placeholder="5562993220950"
            />
          </Field>
          <Field label="E-mail">
            <Input
              value={contact.email}
              onChange={(e) =>
                setContact((c) => ({ ...c, email: e.target.value }))
              }
              className="h-11"
              placeholder="contato@lojalenora.com.br"
            />
          </Field>
          <Field label="Instagram (handle sem @)">
            <Input
              value={contact.instagram}
              onChange={(e) =>
                setContact((c) => ({ ...c, instagram: e.target.value }))
              }
              className="h-11"
              placeholder="loja.lenora"
            />
          </Field>
          <Field label="Facebook (URL ou handle)">
            <Input
              value={contact.facebook}
              onChange={(e) =>
                setContact((c) => ({ ...c, facebook: e.target.value }))
              }
              className="h-11"
              placeholder="lojalenora"
            />
          </Field>
          <Field label="Horário de atendimento">
            <Input
              value={contact.hours}
              onChange={(e) =>
                setContact((c) => ({ ...c, hours: e.target.value }))
              }
              className="h-11"
              placeholder="Seg a Sex, 9h às 17h"
            />
          </Field>
        </div>
        <SaveBar onClick={saveContact} loading={putMut.isPending} />
      </Section>

      {/* ENVIO */}
      <Section
        icon={Truck}
        title="Envio"
        desc="Métodos de entrega exibidos no checkout."
      >
        <div className="space-y-3">
          {shipping.methods.map((m, i) => (
            <div
              key={m.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center"
            >
              <Input
                value={m.id}
                onChange={(e) =>
                  setShipping((s) => ({
                    ...s,
                    methods: s.methods.map((mm, j) =>
                      j === i ? { ...mm, id: e.target.value } : mm,
                    ),
                  }))
                }
                className="h-11 w-full font-mono text-xs sm:w-32"
                placeholder="correios"
              />
              <Input
                value={m.label}
                onChange={(e) =>
                  setShipping((s) => ({
                    ...s,
                    methods: s.methods.map((mm, j) =>
                      j === i ? { ...mm, label: e.target.value } : mm,
                    ),
                  }))
                }
                className="h-11 w-full sm:flex-1"
                placeholder="Nome do método"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={m.cost}
                  onChange={(e) =>
                    setShipping((s) => ({
                      ...s,
                      methods: s.methods.map((mm, j) =>
                        j === i
                          ? { ...mm, cost: Number(e.target.value) || 0 }
                          : mm,
                      ),
                    }))
                  }
                  className="h-11 w-28"
                  placeholder="0,00"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShipping((s) => ({
                      ...s,
                      methods: s.methods.filter((_, j) => j !== i),
                    }))
                  }
                  aria-label="Remover método"
                  className="grid size-11 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Input
                value={m.note ?? ''}
                onChange={(e) =>
                  setShipping((s) => ({
                    ...s,
                    methods: s.methods.map((mm, j) =>
                      j === i ? { ...mm, note: e.target.value } : mm,
                    ),
                  }))
                }
                className="h-11 w-full sm:w-48"
                placeholder="Observação"
              />
            </div>
          ))}
          <Button
            type="button"
            onClick={() =>
              setShipping((s) => ({
                ...s,
                methods: [
                  ...s.methods,
                  {
                    id: `novo-${Date.now()}`,
                    label: 'Novo método',
                    cost: 0,
                    note: '',
                  },
                ],
              }))
            }
            variant="outline"
            className="h-10 gap-1.5 text-xs"
          >
            <Plus className="size-4" />
            Adicionar método
          </Button>
        </div>
        <SaveBar onClick={saveShipping} loading={putMut.isPending} />
      </Section>

      {/* SEO */}
      <Section
        icon={Globe}
        title="SEO"
        desc="Metadados de busca e Open Graph."
      >
        <div className="space-y-4">
          <Field label="Título (até 65 caracteres)">
            <Input
              value={seo.title}
              onChange={(e) =>
                setSeo((s) => ({ ...s, title: e.target.value }))
              }
              className="h-11"
              maxLength={120}
            />
          </Field>
          <Field label="Descrição (até 160 caracteres)">
            <Textarea
              value={seo.description}
              onChange={(e) =>
                setSeo((s) => ({ ...s, description: e.target.value }))
              }
              rows={3}
              maxLength={200}
              className="resize-y"
            />
          </Field>
          <Field label="Palavras-chave (separadas por vírgula)">
            <Input
              value={seo.keywords}
              onChange={(e) =>
                setSeo((s) => ({ ...s, keywords: e.target.value }))
              }
              className="h-11"
            />
          </Field>
          <Field label="Open Graph Image (URL)">
            <Input
              value={seo.ogImage}
              onChange={(e) =>
                setSeo((s) => ({ ...s, ogImage: e.target.value }))
              }
              className="h-11"
              placeholder="/uploads/og.webp"
            />
          </Field>
        </div>
        <SaveBar onClick={saveSeo} loading={putMut.isPending} />
      </Section>

      {/* ADMIN */}
      <Section
        icon={KeyRound}
        title="Admin"
        desc="Altere a senha do painel. A sessão atual continua válida até o cookie expirar."
      >
        <Field label="Nova senha admin">
          <Input
            type="text"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="h-11 font-mono"
            placeholder="••••••••"
            autoComplete="off"
          />
        </Field>
        <SaveBar
          onClick={saveAdmin}
          loading={putMut.isPending}
          label="Atualizar senha"
        />
      </Section>

      <Separator />
      <p className="pb-6 text-center text-[11px] text-muted-foreground">
        Loja Lenora · Painel administrativo · v1.0
      </p>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof User
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-5 text-accent" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-xl">{title}</h3>
          {desc && (
            <p className="text-[11px] text-muted-foreground">{desc}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SaveBar({
  onClick,
  loading,
  label = 'Salvar',
}: {
  onClick: () => void
  loading?: boolean
  label?: string
}) {
  return (
    <div className="mt-5 flex justify-end">
      <Button
        onClick={onClick}
        disabled={loading}
        className="btn-gold h-11 gap-2 border-0 px-6 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {label}
      </Button>
    </div>
  )
}
