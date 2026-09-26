// Floating WhatsApp button (Loja Lenora) — canto inferior esquerdo.
// Verde institucional do WhatsApp. Abre wa.me com mensagem pré-preenchida.
'use client'
import { motion } from 'framer-motion'
import type { SiteSettings } from '@/lib/settings'

export function WhatsappFab({ settings }: { settings: SiteSettings }) {
  const phone = settings.contact.whatsapp?.replace(/\D/g, '')
  if (!phone) return null
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    'Olá! Vim pelo catálogo da Loja Lenora'
  )}`
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 16 }}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 left-5 z-40 flex size-12 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-colors md:bottom-7 md:left-7 md:size-14"
      style={{ background: '#25D366' }}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 md:h-8 md:w-8"
        fill="white"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.5 1.39a.558.558 0 0 1-.31-.1c-.802-.402-2.077-.85-2.882-1.5-.395-.32-.85-.78-.85-.78-.197-.2-.197-.4-.1-.6.1-.2.4-.7.4-.9 0-.2-.6-.7-.7-.9-.1-.2 0-.4 0-.6.1-.4.7-.9.9-1.1.2-.2.4-.4.4-.6 0-.2 0-.4-.2-.6-.4-.9-1.2-2-1.7-2.6-.2-.2-.4-.4-.6-.4-.2 0-.6.3-.8.5-.4.4-.6 1.2-.6 2 0 1.7 1.2 3.3 2.4 4.5 1.2 1.2 2.4 2.4 4.5 2.9.6.1 1.4.1 1.8 0 .4-.1.7-.4.7-.4.1-.2.3-.4.4-.6.1-.2 0-.4 0-.5 0-.1-.3-.4-.5-.5z" />
        <path
          d="M16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.18 1.6 6L4 28l6.1-1.6a12 12 0 0 0 5.94 1.54h.01c6.63 0 12.04-5.4 12.04-12.04C28.09 9.4 22.68 4 16.04 4zm0 22h-.01a10 10 0 0 1-5.1-1.4l-.37-.21-3.77 1 .99-3.67-.24-.38a10 10 0 0 1-1.53-5.32c0-5.5 4.49-9.99 10.04-9.99 2.68 0 5.2 1.05 7.1 2.95a9.93 9.93 0 0 1 2.95 7.1c0 5.5-4.49 10-10.04 10z"
          fillRule="evenodd"
        />
      </svg>
      <span className="sr-only">WhatsApp</span>
    </motion.a>
  )
}
