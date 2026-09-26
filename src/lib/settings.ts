// Loja Lenora — configurações padrão do site
// Cores padrão (branco/preto/dourado) — personalizáveis pelo painel admin.
// Cada chave vira uma linha na tabela Setting (valor em JSON string).

export type SiteSettings = {
  brandName: string
  brandTagline: string
  // Cores customizáveis (CSS vars aplicadas em runtime)
  colors: {
    bg: string // fundo
    surface: string // cards
    text: string // texto principal
    textMuted: string
    primary: string // preto institucional
    primaryForeground: string
    accent: string // dourado
    accentForeground: string
    border: string
  }
  contact: {
    phone: string // 62993220950
    whatsapp: string // formato internacional sem +
    email: string
    instagram: string
    facebook: string
    hours: string
  }
  shipping: {
    methods: { id: string; label: string; cost: number; note?: string }[]
  }
  seo: {
    title: string
    description: string
    keywords: string
    ogImage: string
    // SEO local (LocalBusiness / Google Business Profile)
    local: {
      streetAddress: string
      addressLocality: string // cidade
      addressRegion: string // estado (UF)
      postalCode: string
      addressCountry: string // BR
      latitude: string
      longitude: string
      areaServed: string // área de atendimento
      openingHours: string // ex: Seg-Sex 09:00-17:00
      taxId: string // CNPJ
    }
    // URLs canônicas e redes
    siteUrl: string // https://lojalenora.com.br
    twitterHandle: string
  }
  analytics: {
    ga4Id: string // ex: G-XXXXXXXXXX
    gtmId: string // ex: GTM-XXXXXXX
    facebookPixelId: string
  }
  admin: {
    password: string // senha simples do painel admin (demo)
  }
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'Loja Lenora',
  brandTagline: 'Moda feminina com curadoria, conforto e elegância',
  colors: {
    bg: '#ffffff',
    surface: '#ffffff',
    text: '#0a0a0a',
    textMuted: '#6b6b6b',
    primary: '#0a0a0a',
    primaryForeground: '#ffffff',
    accent: '#C9A24B', // dourado
    accentForeground: '#0a0a0a',
    border: '#e7e3dc',
  },
  contact: {
    phone: '62993220950',
    whatsapp: '5562993220950',
    email: 'Lojalenorah@gmail.com',
    instagram: 'loja.lenora',
    facebook: '',
    hours: 'Seg a Sex, 9h às 17h',
  },
  shipping: {
    methods: [
      { id: 'correios', label: 'Correios', cost: 0, note: 'Calculado após pedido' },
      { id: 'transportadora', label: 'Transportadora', cost: 0, note: 'Para todo Brasil' },
      { id: 'uber', label: 'Uber / Motoboy', cost: 0, note: 'Goiânia e região' },
      { id: 'retirada', label: 'Retirada no local', cost: 0, note: 'Combinar horário' },
    ],
  },
  seo: {
    title: 'Loja Lenora — Moda Feminina Premium | Catálogo Online',
    description:
      'Loja Lenora: roupas femininas com curadoria premium. Cropped, blusa, body, regata, top canelado e tomara que caixa. Compra segura, envio rápido para todo Brasil e atendimento 100% online e personalizado.',
    keywords:
      'loja lenora, moda feminina, roupas femininas, cropped, blusa, body, regata, top canelado, tomara que caixa, catálogo online, moda premium goiania',
    ogImage: '/uploads/hero-desktop.webp',
    local: {
      streetAddress: 'Goiânia, GO',
      addressLocality: 'Goiânia',
      addressRegion: 'GO',
      postalCode: '74000-000',
      addressCountry: 'BR',
      latitude: '-16.6864',
      longitude: '-49.2643',
      areaServed: 'Brasil (envio para todo o território nacional) e Goiânia/região (Uber/Motoboy)',
      openingHours: 'Seg-Sex 09:00-17:00',
      taxId: '00.000.000/0001-00',
    },
    siteUrl: 'https://lojalenora.com.br',
    twitterHandle: 'loja.lenora',
  },
  analytics: {
    ga4Id: '', // preencha com G-XXXXXXXXXX ao ativar
    gtmId: '', // preencha com GTM-XXXXXXX ao ativar
    facebookPixelId: '',
  },
  admin: {
    password: 'lenora2025',
  },
}

// Converte SiteSettings <-> Setting rows
export function settingsToRows(s: SiteSettings) {
  return [
    { key: 'brandName', value: JSON.stringify(s.brandName) },
    { key: 'brandTagline', value: JSON.stringify(s.brandTagline) },
    { key: 'colors', value: JSON.stringify(s.colors) },
    { key: 'contact', value: JSON.stringify(s.contact) },
    { key: 'shipping', value: JSON.stringify(s.shipping) },
    { key: 'seo', value: JSON.stringify(s.seo) },
    { key: 'analytics', value: JSON.stringify(s.analytics) },
    { key: 'admin', value: JSON.stringify(s.admin) },
  ]
}

export function rowsToSettings(rows: { key: string; value: string }[]): SiteSettings {
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return {
    brandName: map.brandName ? JSON.parse(map.brandName) : DEFAULT_SETTINGS.brandName,
    brandTagline: map.brandTagline ? JSON.parse(map.brandTagline) : DEFAULT_SETTINGS.brandTagline,
    colors: map.colors ? JSON.parse(map.colors) : DEFAULT_SETTINGS.colors,
    contact: map.contact ? JSON.parse(map.contact) : DEFAULT_SETTINGS.contact,
    shipping: map.shipping ? JSON.parse(map.shipping) : DEFAULT_SETTINGS.shipping,
    seo: map.seo
      ? { ...DEFAULT_SETTINGS.seo, ...JSON.parse(map.seo) }
      : DEFAULT_SETTINGS.seo,
    analytics: map.analytics ? JSON.parse(map.analytics) : DEFAULT_SETTINGS.analytics,
    admin: map.admin ? JSON.parse(map.admin) : DEFAULT_SETTINGS.admin,
  }
}
