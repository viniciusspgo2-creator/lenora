// AnnouncementBar (Loja Lenora) — faixa deslizante no topo absoluto do site,
// acima do header, em rosa bebê. Mensagens institucionais com pausa no hover.
'use client'
import { motion } from 'framer-motion'

// Mensagens profissionais (boas-vindas + WhatsApp + localização + envio Brasil)
const MESSAGE =
  'Bem-vindas à Loja Lenora! Dúvidas? Fale com a gente pelo WhatsApp · Loja online de Goiânia/GO com envio para todo o Brasil · Atendimento das 9h às 17h · '

export function AnnouncementBar() {
  return (
    <div className="relative z-20 overflow-hidden bg-secondary text-secondary-foreground">
      <div className="marquee-track py-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            aria-hidden={i > 0}
            className="flex items-center gap-12 whitespace-nowrap"
          >
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {MESSAGE}
            </motion.span>
          </span>
        ))}
      </div>
      {/* Linha rosa de detalhe na base da faixa */}
      <div className="gold-line h-px" />
    </div>
  )
}
