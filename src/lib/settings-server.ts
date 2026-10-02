import { db } from '@/lib/db'
import {
  DEFAULT_SETTINGS,
  PALETTE_VERSION,
  rowsToSettings,
  withPaletteVersion,
  type SiteSettings,
} from '@/lib/settings'

// Cache em memória das configurações (evita query por request no SSR)
let cache: SiteSettings | null = null
let cacheTs = 0
const TTL = 30_000 // 30s

// Lê configurações do banco; se não houver, grava os defaults.
// Se a linha "colors" for de uma versão antiga da paleta (ex.: dourada salva
// por uma build anterior), substitui pelos defaults atuais e regrava no banco
// — o site se corrige sozinho no primeiro acesso após o deploy.
export async function getSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cacheTs < TTL) return cache
  let rows = await db.setting.findMany()
  if (rows.length === 0) {
    // grava defaults na primeira execução (já com a versão da paleta)
    const data = [
      { key: 'brandName', value: JSON.stringify(DEFAULT_SETTINGS.brandName) },
      { key: 'brandTagline', value: JSON.stringify(DEFAULT_SETTINGS.brandTagline) },
      {
        key: 'colors',
        value: JSON.stringify(withPaletteVersion(DEFAULT_SETTINGS.colors)),
      },
      { key: 'contact', value: JSON.stringify(DEFAULT_SETTINGS.contact) },
      { key: 'shipping', value: JSON.stringify(DEFAULT_SETTINGS.shipping) },
      { key: 'seo', value: JSON.stringify(DEFAULT_SETTINGS.seo) },
      { key: 'admin', value: JSON.stringify(DEFAULT_SETTINGS.admin) },
    ]
    await db.setting.createMany({ data })
    rows = await db.setting.findMany()
  } else {
    // Auto-cura: paleta desatualizada no banco → sobrescreve com a atual.
    const colorsRow = rows.find((r) => r.key === 'colors')
    let stale = true
    if (colorsRow) {
      try {
        const parsed = JSON.parse(colorsRow.value) as { _paletteVersion?: string }
        stale = parsed?._paletteVersion !== PALETTE_VERSION
      } catch {
        stale = true
      }
    }
    if (stale) {
      const fixed = await db.setting.upsert({
        where: { key: 'colors' },
        update: { value: JSON.stringify(withPaletteVersion(DEFAULT_SETTINGS.colors)) },
        create: {
          key: 'colors',
          value: JSON.stringify(withPaletteVersion(DEFAULT_SETTINGS.colors)),
        },
      })
      rows = rows.filter((r) => r.key !== 'colors').concat(fixed)
    }
  }
  cache = rowsToSettings(rows)
  cacheTs = Date.now()
  return cache
}

export function invalidateSettingsCache() {
  cache = null
  cacheTs = 0
}

// Converte as cores customizadas em variáveis CSS que o layout injeta.
export function settingsToCssVars(s: SiteSettings): string {
  const c = s.colors
  return `:root{
--background:${c.bg};
--surface:${c.surface};
--foreground:${c.text};
--muted-foreground:${c.textMuted};
--primary:${c.primary};
--primary-foreground:${c.primaryForeground};
--accent:${c.accent};
--accent-foreground:${c.accentForeground};
--border:${c.border};
}`
}
