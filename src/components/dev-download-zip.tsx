// ⚠️ COMPONENTE TEMPORÁRIO (DEV-ONLY) — NÃO FAZ PARTE DO SITE EM PRODUÇÃO.
//
// Este botão flutuante serve apenas para baixar o zip do projeto durante o
// desenvolvimento. Ele é renderizado SOMENTE quando:
//   1. process.env.NODE_ENV === 'development' (strip no build de produção), E
//   2. o arquivo /loja-lenora-projeto.zip responde 200 (auto-hide se não existir).
//
// No deploy (bun run build && bun run start) o NODE_ENV vira 'production' e o
// Next.js tree-shake este componente — ele some completamente. Mesmo em dev,
// se o zip não estiver no public/, o HEAD falha e o botão não aparece.
'use client'
import { useEffect, useState } from 'react'
import { Download, X, Package } from 'lucide-react'

const ZIP_PATH = '/loja-lenora-projeto.zip'
const DISMISS_KEY = 'lenora-dev-zip-dismissed'

export function DevDownloadZip() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY)) return
    // só mostra se o zip realmente existir no servidor
    fetch(ZIP_PATH, { method: 'HEAD' })
      .then((r) => setShow(r.ok))
      .catch(() => setShow(false))
  }, [])

  if (!show) return null

  return (
    <div className="fixed left-1/2 top-2 z-[100] -translate-x-1/2 animate-[fadeIn_.4s_ease]">
      <a
        href={ZIP_PATH}
        download="loja-lenora-projeto.zip"
        className="group flex items-center gap-2.5 rounded-full border border-amber-400 bg-amber-500 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_8px_30px_-6px_rgba(245,158,11,0.7)] backdrop-blur transition-transform hover:scale-[1.03] active:scale-95"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-white/25">
          <Package className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <span className="hidden sm:inline">Baixar projeto (zip)</span>
        <span className="sm:hidden">Baixar zip</span>
        <Download className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" strokeWidth={2.5} />
        <span className="ml-1 rounded bg-white/25 px-1.5 py-0.5 text-[8px] tracking-widest">DEV</span>
      </a>
      <button
        onClick={() => {
          setShow(false)
          if (typeof window !== 'undefined') localStorage.setItem(DISMISS_KEY, '1')
        }}
        aria-label="Fechar botão de download (temporário)"
        className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border border-amber-400 bg-white text-amber-600 shadow-md transition-colors hover:bg-amber-50"
      >
        <X className="h-3 w-3" strokeWidth={3} />
      </button>
    </div>
  )
}
