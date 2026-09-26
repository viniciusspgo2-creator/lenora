// Barra de busca fixa abaixo do header (Loja Lenora).
// Aparece em todas as páginas do storefront. Ao digitar e enviar,
// navega para a view de produtos com o termo aplicado.
'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useViewNav } from '@/lib/nav'

export function SearchBar() {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const nav = useViewNav()
  const inputRef = useRef<HTMLInputElement>(null)

  // Atalho: "/" foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    nav({ view: 'shop', q: term })
    inputRef.current?.blur()
  }

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur">
      <div className="container-lenora py-2.5">
        <form onSubmit={submit} className="relative mx-auto max-w-3xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar por vestido, blusa, cor, tamanho…"
            aria-label="Buscar produtos"
            className={`h-11 w-full rounded-full border bg-secondary/60 pl-10 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:bg-background focus:border-accent focus:ring-2 focus:ring-accent/25 ${
              focused ? 'border-accent' : 'border-border'
            }`}
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                inputRef.current?.focus()
              }}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
