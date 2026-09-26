// Loja Lenora — Admin Login.
// Tela de autenticação simples: pede a senha admin e faz POST em /api/admin/login.
// Em sucesso, recarrega para ?view=admin&tab=dashboard (o cookie já está setado pela API).
'use client'
import { useState } from 'react'
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function AdminLogin({ brand }: { brand: string }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('Digite a senha.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await r.json()
      if (!r.ok) {
        toast.error(data?.error ?? 'Senha inválida.')
        setLoading(false)
        return
      }
      toast.success('Bem-vinda ao painel ✨')
      // Recarrega passando o tab=dashboard — o cookie agora é válido.
      window.location.href = '/?view=admin&tab=dashboard'
    } catch {
      toast.error('Falha de rede. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      {/* ornamentos dourados de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, var(--accent) 0, transparent 35%), radial-gradient(circle at 80% 80%, var(--accent) 0, transparent 35%)',
        }}
      />
      <div className="gold-line absolute top-0 left-0 right-0" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            Painel administrativo
            <span className="size-1.5 rounded-full bg-accent" />
          </div>
          <h1 className="font-serif text-5xl tracking-[0.08em]">
            {brand || 'Lenora'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Acesso restrito à equipe Lenora.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-lg border border-border bg-surface p-6 shadow-[0_24px_60px_-20px_rgba(10,10,10,.15)] sm:p-8"
        >
          <label
            htmlFor="admin-password"
            className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground"
          >
            <Lock className="size-3.5 text-accent" />
            Senha
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={show ? 'text' : 'password'}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-md border border-border bg-background px-4 pr-12 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm uppercase tracking-[0.25em] disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-2 animate-pulse rounded-full bg-current" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Dica: a senha padrão é <span className="font-mono">lenora2025</span>.
          </p>
        </form>

        <a
          href="/?view=home"
          className="mt-6 block text-center text-xs uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
        >
          ← Voltar à loja
        </a>
      </div>
    </div>
  )
}
