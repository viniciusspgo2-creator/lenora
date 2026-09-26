// Chatbot Widget (Loja Lenora) — Lia, assistente virtual.
// Botão flutuante (canto inferior direito) + Popover com conversa.
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useUI } from '@/lib/store-ui'
import { useViewNav } from '@/lib/nav'
import { formatBRL } from '@/lib/utils-lenora'

type ChatProduct = {
  name: string
  slug: string
  price: number
  image?: string | null
}

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  products?: ChatProduct[]
}

const SUGGESTIONS = [
  'Ache um vestido preto',
  'Tem promoção?',
  'Como rastrear meu pedido?',
]

export function ChatbotWidget() {
  const open = useUI((s) => s.chatOpen)
  const setOpen = useUI((s) => s.setChatOpen)
  const nav = useViewNav()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mensagem de boas-vindas ao abrir
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text:
            'Olá! Eu sou a Lia, sua assistente na Loja Lenora. 🌸 Posso te ajudar a encontrar peças, tirar dúvidas sobre tamanhos, envio e pagamento. Como posso ajudar?',
        },
      ])
    }
  }, [open, messages.length])

  // Auto-scroll para o fim
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: content }])
    setLoading(true)
    try {
      const r = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      const j = await r.json()
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: j.reply ?? 'Desculpe, não consegui processar agora. Tente novamente.',
          products: j.products ?? [],
        },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: 'Tive um problema de conexão. Pode tentar de novo?',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const goToProduct = (slug: string) => {
    setOpen(false)
    nav({ view: 'product', slug })
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Fechar chat' : 'Abrir chat com a Lia'}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 16 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-black/20 transition-transform md:bottom-7 md:right-7 md:size-14"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-foreground opacity-60" />
            <span className="relative inline-flex size-3.5 rounded-full bg-accent-foreground" />
          </span>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed bottom-24 right-4 z-40 flex h-[min(560px,70vh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/30 md:right-7"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-serif text-base leading-tight">Lia · Assistente Lenora</p>
                  <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Online agora
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-md text-primary-foreground/80 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground'
                        : 'max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm bg-background px-3.5 py-2 text-sm shadow-sm border border-border'
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                    {/* Produtos recomendados */}
                    {m.products && m.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.products.map((p) => (
                          <button
                            key={p.slug}
                            onClick={() => goToProduct(p.slug)}
                            className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:border-accent hover:bg-muted/50"
                          >
                            <div className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-accent" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-serif text-sm leading-tight">
                                {p.name}
                              </p>
                              <p className="text-xs font-medium text-accent tabular-nums">
                                {formatBRL(p.price)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-background border border-border px-3.5 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="size-2 animate-bounce rounded-full bg-accent"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions iniciais */}
              {messages.length === 1 && !loading && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Sugestões
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2 border-t border-border bg-background px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Enviar"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
