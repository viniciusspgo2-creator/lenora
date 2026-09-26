// Injeta as variáveis CSS das cores customizadas (vindas do banco)
// no <head> da página. Server Component: roda no servidor e injeta um <style>.
import { settingsToCssVars } from "@/lib/settings-server";
import type { SiteSettings } from "@/lib/settings";

export function SettingsServerInjector({
  settings,
}: {
  settings: SiteSettings
}) {
  return (
    <style
      id="lenora-settings"
      dangerouslySetInnerHTML={{ __html: settingsToCssVars(settings) }}
    />
  )
}
