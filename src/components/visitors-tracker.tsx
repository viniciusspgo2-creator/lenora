// Registra uma visita por sessão de navegador no banco.
// Usa sessionStorage para registrar 1 visita por sessão (não spammar a cada navegação).
'use client'
import { useEffect } from 'react'

export function VisitorsTracker() {
  useEffect(() => {
    const key = 'lenora-visit-logged'
    const session = sessionStorage.getItem(key)
    if (session) return
    sessionStorage.setItem(key, '1')
    // chama a API que grava a visita
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname + window.location.search,
        referrer: document.referrer,
      }),
    }).catch(() => {})
  }, [])
  return null
}
