// Loja Lenora — SEO infrastructure
// JSON-LD schema generators (pure, sync, server-side).
// Each function returns a plain JS object to be `JSON.stringify`'d into
// <script type="application/ld+json"> tags. The SiteSettings is read once
// per request via getSettings() and passed in.
//
// URL strategy:
// - All URLs in JSON-LD are absolute (https://lojalenora.com.br/?view=...).
// - The base is taken from settings.seo.siteUrl. If empty, falls back to a
//   relative URL (so the schema still emits something useful for debugging
//   in dev). Search engines require absolute URLs for full validity.
//
// Conventions:
// - '@context': 'https://schema.org' on every root object.
// - @id is used for cross-referencing Organization / WebSite / Store across
//   schemas on the same page (search engines merge them by @id).
// - `undefined` values are stripped by JSON.stringify automatically, so we
//   can safely pass `optional || undefined`.
//
// IMPORTANT: This module is server-side only (used by app/layout.tsx,
// app/page.tsx, app/sitemap.ts, app/robots.ts). Do not import from a Client
// Component.

import type { SiteSettings } from '@/lib/settings'

// Minimal product shape accepted by productSchema(). The full ProductDetail
// from the storefront is wider; callers map to this shape before invoking.
export type ProductLite = {
  name: string
  slug: string
  price: number
  compareAt?: number | null
  description: string
  images: { url: string; isMain: boolean }[]
  colors: { name: string; hex: string }[]
  sizes: { name: string }[]
  category?: { name: string; slug: string } | null
  sku?: string | null
}

// ───────────────────────── helpers ─────────────────────────

/**
 * Join settings.seo.siteUrl + pathOrQuery into an absolute URL.
 * - If siteUrl is empty, returns a relative URL (for dev / preview).
 * - `pathOrQuery` can be a query string ('?view=product&slug=...'),
 *   a path ('/sitemap.xml'), or empty ('' -> bare origin).
 * - Never throws; trims trailing slashes from the base.
 */
export function absUrl(settings: SiteSettings, pathOrQuery: string): string {
  const base = (settings.seo?.siteUrl ?? '').replace(/\/+$/, '')
  const q = pathOrQuery ?? ''
  if (!base) {
    if (!q) return '/'
    return q.startsWith('/') ? q : `/${q}`
  }
  if (!q) return base
  // Query/hash starts without a separator; absolute paths already include '/'
  const sep = q.startsWith('?') || q.startsWith('#') || q.startsWith('/') ? '' : '/'
  return `${base}${sep}${q}`
}

// SameAs links (Instagram, Facebook, Twitter) — cleaned of empties.
function sameAs(settings: SiteSettings): string[] {
  const out: string[] = []
  if (settings.contact?.instagram) {
    out.push(`https://instagram.com/${settings.contact.instagram.replace(/^@/, '')}`)
  }
  if (settings.contact?.facebook) {
    out.push(`https://facebook.com/${settings.contact.facebook.replace(/^@/, '')}`)
  }
  if (settings.seo?.twitterHandle) {
    out.push(`https://twitter.com/${settings.seo.twitterHandle.replace(/^@/, '')}`)
  }
  return out
}

// Telephone in international E.164 format ('+5562993220950').
function telephone(settings: SiteSettings): string | undefined {
  const w = settings.contact?.whatsapp
  if (!w) return undefined
  return w.startsWith('+') ? w : `+${w}`
}

// ───────────────────────── Organization ─────────────────────────
// The brand as a whole. Referenced as 'publisher' by WebPage / WebSite and
// as 'seller' by Product offers.
export function organizationSchema(settings: SiteSettings) {
  const site = absUrl(settings, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: settings.brandName,
    alternateName: settings.brandTagline || undefined,
    url: site || undefined,
    description: settings.seo.description || undefined,
    email: settings.contact.email || undefined,
    telephone: telephone(settings),
    logo: {
      '@type': 'ImageObject',
      url: absUrl(settings, '/logo.svg'),
    },
    sameAs: sameAs(settings),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: settings.contact.email || undefined,
        telephone: telephone(settings),
        availableLanguage: ['Portuguese', 'pt-BR'],
        areaServed: 'BR',
      },
    ],
  }
}

// ───────────────────────── WebSite (sitelinks search box) ─────────────────────────
// Enables Google's "Sitelinks Search Box" feature — the search input in
// SERP results links directly to our shop search.
export function websiteSchema(settings: SiteSettings) {
  const site = absUrl(settings, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    url: site || undefined,
    name: settings.brandName,
    alternateName: settings.brandTagline || undefined,
    description: settings.seo.description || undefined,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${site}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absUrl(settings, '?view=shop&q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ───────────────────────── LocalBusiness / ClothingStore ─────────────────────────
// SEO local — aparece no Google Maps / Business Profile e rich results.
// Inclui endereço completo, geo, openingHours, areaServed, taxId (CNPJ).
export function localBusinessSchema(settings: SiteSettings) {
  const site = absUrl(settings, '')
  const L = settings.seo.local
  const ogImage = settings.seo.ogImage
    ? absUrl(settings, settings.seo.ogImage)
    : undefined

  // Parse "Seg-Sex 09:00-17:00" or "Mo-Fr 09:00-17:00" — best effort.
  // Schema.org DayOfWeek uses the English short forms (Monday...Sunday),
  // so we map common PT-BR tokens. If parse fails we just emit a human
  // readable openingHours string via openingHoursSpecification.description.
  const openingHoursSpec = L?.openingHours
    ? [
        {
          '@type': 'OpeningHoursSpecification',
          description: L.openingHours,
        },
      ]
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': `${site}/#store`,
    name: settings.brandName,
    description: settings.seo.description || undefined,
    url: site || undefined,
    telephone: telephone(settings),
    email: settings.contact.email || undefined,
    image: ogImage,
    logo: {
      '@type': 'ImageObject',
      url: absUrl(settings, '/logo.svg'),
    },
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: L?.streetAddress || undefined,
      addressLocality: L?.addressLocality || undefined,
      addressRegion: L?.addressRegion || undefined,
      postalCode: L?.postalCode || undefined,
      addressCountry: L?.addressCountry || 'BR',
    },
    geo:
      L?.latitude && L?.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: L.latitude,
            longitude: L.longitude,
          }
        : undefined,
    areaServed: L?.areaServed
      ? { '@type': 'Place', name: L.areaServed }
      : undefined,
    openingHoursSpecification: openingHoursSpec,
    taxID: L?.taxId || undefined,
    sameAs: sameAs(settings),
    parentOrganization: { '@id': `${site}/#organization` },
  }
}

// ───────────────────────── WebPage (genérico) ─────────────────────────
// Use para qualquer página que não tem schema dedicado (home, shop, account…).
// name/description/url são passados pela view dona da página.
export function webPageSchema(
  settings: SiteSettings,
  opts: { name: string; description: string; url: string }
) {
  const site = absUrl(settings, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${site}/#website` },
    publisher: { '@id': `${site}/#organization` },
  }
}

// ───────────────────────── BreadcrumbList ─────────────────────────
// Recebe uma lista de breadcrumbs (já em ordem, com name + url absoluta).
// Ex: [{name:'Home',url:'...?view=home'},{name:'Cropped',url:'...?view=shop&category=cropped'}]
export function breadcrumbSchema(
  settings: SiteSettings,
  items: { name: string; url: string }[]
) {
  // settings kept for symmetry / future breadcrumb URL building
  void settings
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

// ───────────────────────── Product ─────────────────────────
// Schema completo de produto. Sempre em estoque (loja aceita pedido via
// WhatsApp), e inclui MerchantReturnPolicy de 7 dias (BR).
export function productSchema(settings: SiteSettings, product: ProductLite) {
  const site = absUrl(settings, '')
  const productUrl = absUrl(
    settings,
    `?view=product&slug=${encodeURIComponent(product.slug)}`
  )

  const mainImage =
    product.images.find((i) => i.isMain) || product.images[0]

  // Image: schema.org aceita string OU ImageObject. Para rich results,
  // Google prefere ao menos uma imagem absoluta; passamos todas.
  const imageList = product.images.length
    ? product.images.map((i) => absUrl(settings, i.url))
    : mainImage
      ? [absUrl(settings, mainImage.url)]
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    sku: product.sku || undefined,
    url: productUrl,
    image: imageList,
    brand: { '@type': 'Brand', name: settings.brandName },
    category: product.category?.name || undefined,
    color: product.colors.map((c) => c.name).filter(Boolean),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: productUrl,
      seller: { '@id': `${site}/#organization` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'BR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteWindow',
        merchantReturnDays: 7,
      },
    },
  }
}

// ───────────────────────── ItemList ─────────────────────────
// Lista de produtos (home destacados, shop, favoritos). Recebe items
// com name+url absoluta. Adiciona position automaticamente.
export function itemListSchema(
  settings: SiteSettings,
  items: { name: string; url: string }[]
) {
  void settings
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      url: it.url,
    })),
  }
}

// ───────────────────────── FAQPage ─────────────────────────
// Lista de perguntas/respostas — usado nas páginas de políticas para
// aumentar шанс de rich results "People also ask" snippets.
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

// ───────────────────────── ContactPage ─────────────────────────
// Schema dedicado pra página de contato. Tem telefone, email e
// referência ao WebSite + Organization.
export function contactPageSchema(settings: SiteSettings) {
  const site = absUrl(settings, '')
  const url = absUrl(settings, '?view=contact')
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contato — ${settings.brandName}`,
    description: `Fale com a ${settings.brandName}: WhatsApp, telefone e email.`,
    url,
    email: settings.contact.email || undefined,
    telephone: telephone(settings),
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${site}/#website` },
    publisher: { '@id': `${site}/#organization` },
  }
}
