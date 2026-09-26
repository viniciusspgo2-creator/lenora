// ContactView (Loja Lenora) — página de contato com formulário que monta
// uma mensagem e envia para o WhatsApp da loja.
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRight,
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  settings: SiteSettings
}

const SUBJECTS = [
  'Dúvida sobre produto',
  'Tamanhos e medidas',
  'Status do meu pedido',
  'Troca ou devolução',
  'Parceria / Colaboração',
  'Outro assunto',
]

export function ContactView({ settings }: Props) {
  const nav = useViewNav()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const wa = settings.contact.whatsapp
  const phoneDisplay = `(${settings.contact.phone.slice(0, 2)}) ${settings.contact.phone.slice(2, 7)}-${settings.contact.phone.slice(7)}`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !subject.trim() || !message.trim()) {
      toast.error('Preencha nome, assunto e mensagem.')
      return
    }
    // Monta a mensagem do WhatsApp
    const lines = [
      'Olá, Loja Lenora! 🌷',
      '',
      `*Assunto:* ${subject}`,
      `*Nome:* ${name}`,
      phone ? `*Meu telefone:* ${phone}` : '',
      '',
      '📝 Mensagem:',
      message,
    ].filter(Boolean)
    const text = encodeURIComponent(lines.join('\n'))
    const url = `https://wa.me/${wa}?text=${text}`
    window.open(url, '_blank')
    toast.success('Abrindo o WhatsApp da loja…', {
      description: 'Sua mensagem foi montada prontinha para enviar.',
    })
  }

  const contactCards = [
    {
      icon: Phone,
      label: 'Telefone / WhatsApp',
      value: phoneDisplay,
      href: `https://wa.me/${wa}`,
    },
    {
      icon: Mail,
      label: 'E-mail comercial',
      value: settings.contact.email,
      href: `mailto:${settings.contact.email}`,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: `@${settings.contact.instagram}`,
      href: `https://instagram.com/${settings.contact.instagram}`,
    },
    {
      icon: Clock,
      label: 'Horário de atendimento',
      value: settings.contact.hours,
    },
  ]

  return (
    <div className="fade-in">
      {/* HEADER */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container-lenora flex flex-col gap-3 py-12 text-center md:py-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            Fale com a gente
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Contato
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Atendimento 100% online e personalizado. Preencha o formulário e
            a mensagem vai direto pro nosso WhatsApp, ou use um dos canais
            abaixo.
          </p>
        </div>
      </section>

      <div className="container-lenora py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* COLUNA ESQUERDA: cards de contato + info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            {contactCards.map((c, i) => {
              const Icon = c.icon
              const content = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {c.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {c.value}
                    </span>
                  </span>
                </>
              )
              return c.href ? (
                <a
                  key={i}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-accent hover:shadow-[0_10px_30px_-12px_rgba(201,162,75,0.4)]"
                >
                  {content}
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                </a>
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                >
                  {content}
                </div>
              )
            })}

            {/* Atendimento online destaque */}
            <div className="mt-2 rounded-lg border border-accent/40 bg-accent/5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <MessageCircle className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Atendimento 100% online
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Resposta rápida no WhatsApp das 9h às 17h.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-4 text-accent" />
              Goiânia e região · Envio para todo Brasil
            </div>
          </motion.div>

          {/* COLUNA DIREITA: formulário */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <form
              onSubmit={submit}
              className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 md:p-8"
            >
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-bold tracking-tight">
                  Envie sua mensagem
                </h2>
                <p className="text-sm text-muted-foreground">
                  Vai direto pro WhatsApp da loja, prontinho pra enviar.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Nome *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="h-12"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Telefone (opcional)
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Seu WhatsApp com DDD"
                  className="h-12"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Assunto *
                </Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Escolha o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Mensagem *
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua dúvida, pedido ou mensagem…"
                  className="min-h-32 resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-gold inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold uppercase tracking-[0.18em]"
              >
                <Send className="h-4 w-4" />
                Enviar pelo WhatsApp
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                Ao enviar, abriremos o WhatsApp com sua mensagem pronta.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
