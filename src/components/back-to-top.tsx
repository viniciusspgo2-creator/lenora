// Botão "voltar ao topo" — flutua acima do chatbot (canto inferior direito).
// Some quando o topo da página está visível; aparece após rolar ~400px.
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={toTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-[5.5rem] right-5 z-40 flex size-12 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-[0_8px_30px_-8px_rgba(80,7,36,0.3)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent active:scale-90"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
