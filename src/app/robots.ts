// Loja Lenora — dynamic robots.txt (/robots.txt)
// Generated at request time. Allows all crawlers to access the storefront
// while blocking the API, admin and account views (which are private and
// must never appear in search results). Declares the sitemap location and
// the canonical host.
//
// NOTE: The old static `public/robots.txt` was deleted so this route
// takes precedence. Next.js metadata-routes auto-serves /robots.txt from
// this default export.

import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/settings-server'
import { absUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings()
  const site = absUrl(settings, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/?view=admin', '/?view=account'],
        crawlDelay: 1,
      },
    ],
    sitemap: site ? `${site}/sitemap.xml` : '/sitemap.xml',
    host: site || undefined,
  }
}
