/**
 * Firm theme CSS variable values (HSL without hsl()).
 * Applied on document.documentElement so Tailwind’s hsl(var(--primary)) etc. pick them up.
 * theme can be a preset name (emerald, violet, ...) or a hex code (#RRGGBB).
 */

/** Parse hex (#RGB or #RRGGBB) to HSL. Returns "h s% l%" for Tailwind. */
function hexToHslString(hex: string): string {
  const normalized = hex.replace(/^#/, '');
  let r: number, g: number, b: number;
  if (normalized.length === 3) {
    r = parseInt(normalized[0] + normalized[0], 16) / 255;
    g = parseInt(normalized[1] + normalized[1], 16) / 255;
    b = parseInt(normalized[2] + normalized[2], 16) / 255;
  } else if (normalized.length === 6) {
    r = parseInt(normalized.slice(0, 2), 16) / 255;
    g = parseInt(normalized.slice(2, 4), 16) / 255;
    b = parseInt(normalized.slice(4, 6), 16) / 255;
  } else {
    return '220 70% 50%'; // fallback
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

/** Generate theme CSS vars from a single hex color (primary); derive sidebar shades. */
function themeVarsFromHex(hex: string): Record<string, string> {
  const primary = hexToHslString(hex);
  const [h, sPart, lPart] = primary.split(/\s+/);
  const s = sPart?.replace('%', '') ?? '70';
  const l = lPart?.replace('%', '') ?? '50';
  const sNum = Math.min(100, Math.max(0, parseInt(s, 10) || 70));
  const lNum = Math.min(100, Math.max(0, parseInt(l, 10) || 50));
  return {
    '--primary': `${h} ${sNum}% ${lNum}%`,
    '--accent': `${h} ${sNum}% ${lNum}%`,
    '--ring': `${h} ${sNum}% ${lNum}%`,
    '--sidebar-background': `${h} ${sNum}% 25%`,
    '--sidebar-primary': `${h} ${sNum}% 45%`,
    '--sidebar-accent': `${h} ${Math.min(sNum, 70)}% 30%`,
    '--sidebar-border': `${h} ${Math.min(sNum, 70)}% 30%`,
    '--sidebar-ring': `${h} ${sNum}% 45%`,
  };
}

export const THEME_VARS: Record<string, Record<string, string>> = {
  emerald: {
    '--primary': '160 84% 39%',
    '--accent': '160 84% 39%',
    '--ring': '160 84% 39%',
    '--sidebar-background': '160 84% 25%',
    '--sidebar-primary': '160 84% 45%',
    '--sidebar-accent': '160 70% 30%',
    '--sidebar-border': '160 70% 30%',
    '--sidebar-ring': '160 84% 45%',
  },
  violet: {
    '--primary': '263 70% 50%',
    '--accent': '263 70% 50%',
    '--ring': '263 70% 50%',
    '--sidebar-background': '263 70% 30%',
    '--sidebar-primary': '263 70% 58%',
    '--sidebar-accent': '263 60% 35%',
    '--sidebar-border': '263 60% 35%',
    '--sidebar-ring': '263 70% 58%',
  },
  slate: {
    '--primary': '215 25% 35%',
    '--accent': '215 25% 35%',
    '--ring': '215 25% 35%',
    '--sidebar-background': '215 25% 22%',
    '--sidebar-primary': '215 25% 45%',
    '--sidebar-accent': '215 20% 28%',
    '--sidebar-border': '215 20% 28%',
    '--sidebar-ring': '215 25% 45%',
  },
  amber: {
    '--primary': '38 92% 50%',
    '--accent': '38 92% 50%',
    '--ring': '38 92% 50%',
    '--sidebar-background': '38 92% 32%',
    '--sidebar-primary': '38 92% 55%',
    '--sidebar-accent': '38 85% 38%',
    '--sidebar-border': '38 85% 38%',
    '--sidebar-ring': '38 92% 55%',
  },
};

const VAR_NAMES = [
  '--primary', '--accent', '--ring',
  '--sidebar-background', '--sidebar-primary', '--sidebar-accent',
  '--sidebar-border', '--sidebar-ring',
];

export const HEX_REG = /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/;
export function isThemeHex(value: string | undefined): boolean {
  return !!value && HEX_REG.test(value.trim());
}

export function applyFirmTheme(root: HTMLElement, theme: string | null): void {
  root.removeAttribute('data-theme');
  VAR_NAMES.forEach((name) => root.style.removeProperty(name));

  const raw = theme && theme.trim() !== '' && theme.trim() !== 'default' ? theme.trim() : null;
  if (!raw) return;

  const isHex = HEX_REG.test(raw);
  if (isHex) {
    root.setAttribute('data-theme', 'custom');
    const vars = themeVarsFromHex(raw);
    Object.entries(vars).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    return;
  }

  const key = raw.toLowerCase();
  if (THEME_VARS[key]) {
    root.setAttribute('data-theme', key);
    Object.entries(THEME_VARS[key]).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }
}
