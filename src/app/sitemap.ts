// Loja Lenora — dynamic XML sitemap (/sitemap.xml)
// Generated at request time from DB. Covers home, shop (with sort variants),
// each active category, each active product (with main image), contact and
// 5 policy pages. URLs are absolute via absUrl(settings.seo.siteUrl, ...).
//
// Next.js metadata-routes spec: a default-async export returning
// `MetadataRoute.Sitemap` (array of entries) auto-serves /sitemap.xml.

import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings-server'
import { absUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const POLICIES = ['trocas', 'vendas', 'termos', 'privacidade', 'cookies'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings()
  const now = new Date()

  // Parallel DB pulls — both must not throw (DB may be mid-migrate).
  const [categories, products] = await Promise.all([
    db.category
      .findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => [] as { slug: string; updatedAt: Date }[]),
    db.product
      .findMany({
        where: { status: 'active' },
        select: {
          slug: true,
          name: true,
          updatedAt: true,
          images: {
            // Only need the main image for the <image:image> entry.
            where: { isMain: true },
            take: 1,
          },
        },
      })
      .catch(
        () =>
          [] as {
            slug: string
            name: string
            updatedAt: Date
            images: { url: string }[]
          }[]
      ),
  ])

  const entries: MetadataRoute.Sitemap = []

  // ─── Home ───
  entries.push({
    url: absUrl(settings, '?view=home'),
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  })

  // ─── Shop (all products) ───
  entries.push({
    url: absUrl(settings, '?view=shop'),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  })

  // ─── Shop sort variants ───
  entries.push({
    url: absUrl(settings, '?view=shop&sort=newest'),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  })
  entries.push({
    url: absUrl(settings, '?view=shop&sort=featured'),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  })

  // ─── Categories ───
  for (const c of categories) {
    entries.push({
      url: absUrl(
        settings,
        `?view=shop&category=${encodeURIComponent(c.slug)}`
      ),
      lastModified: c.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // ─── Products ───
  for (const p of products) {
    const main = p.images?.[0]
    entries.push({
      url: absUrl(
        settings,
        `?view=product&slug=${encodeURIComponent(p.slug)}`
      ),
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.7,
      // Next.js 16 MetadataRoute.Sitemap only accepts images?: string[]
      // (object form with {url,title,...} serializes as '[object Object]').
      // Pass the absolute URL of the product's main WebP image.
      images: main ? [absUrl(settings, main.url)] : undefined,
    })
  }

  // ─── Contact ───
  entries.push({
    url: absUrl(settings, '?view=contact'),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  })

  // ─── Policies ───
  for (const pol of POLICIES) {
    entries.push({
      url: absUrl(settings, `?view=policies&policy=${pol}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    })
  }

  return entries
}
