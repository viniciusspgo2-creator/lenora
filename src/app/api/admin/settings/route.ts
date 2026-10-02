// GET /api/admin/settings — retorna configurações completas.
// PUT /api/admin/settings — atualiza chaves (upsert por chave) e invalida cache.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getSettings,
  invalidateSettingsCache,
} from '@/lib/settings-server'
import { withPaletteVersion, type SiteSettings } from '@/lib/settings'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

const ALLOWED_KEYS: (keyof SiteSettings)[] = [
  'brandName',
  'brandTagline',
  'colors',
  'contact',
  'shipping',
  'seo',
  'admin',
]

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard
    const settings = await getSettings()
    return NextResponse.json({ settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const body = await req.json() as Partial<SiteSettings>

    for (const key of ALLOWED_KEYS) {
      if (body[key] !== undefined) {
        // Cores salvas pelo painel ganham a versão atual da paleta, para não
        // serem confundidas com paletas desatualizadas em leituras futuras.
        const value =
          key === 'colors'
            ? JSON.stringify(withPaletteVersion(body[key] as SiteSettings['colors']))
            : JSON.stringify(body[key])
        await db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    }

    invalidateSettingsCache()
    const settings = await getSettings()
    return NextResponse.json({ settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
