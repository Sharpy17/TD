import { Icon, type IconName } from "./Icon";

/**
 * Modules store a short glyph (see PRESET_MODULE_ICONS); the UI draws it from the
 * shared SVG set so existing rows keep working without a data migration.
 */
const glyphIcons: Record<string, IconName> = {
  "◆": "diamond",
  "▦": "grid",
  "●": "circle",
  "◉": "circle",
  "⚡": "bolt",
  "🎛": "sliders",
  "🛡️": "shield",
  "🛡": "shield",
  "📱": "device",
  "🚀": "rocket",
  "🧠": "spark",
  "🐛": "bug",
  "♫": "music",
};

export function moduleIconName(glyph: string | null | undefined): IconName {
  return (glyph && glyphIcons[glyph.trim()]) || "diamond";
}

export function ModuleIcon({ glyph, size = 16 }: { glyph: string | null | undefined; size?: number }) {
  return <Icon name={moduleIconName(glyph)} size={size} />;
}
