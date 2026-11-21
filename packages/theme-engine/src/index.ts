import type { ThemeConfig } from '@pagecraft/types';

export const FONT_PAIRINGS = [
  { name: 'Inter (Modern Sans)', value: 'Inter, system-ui, sans-serif' },
  { name: 'JetBrains Mono (Technical Mono)', value: 'JetBrains Mono, monospace' },
  { name: 'Playfair Display (Editorial Serif)', value: 'Playfair Display, Georgia, serif' },
  { name: 'Plus Jakarta Sans (Geometric Sans)', value: 'Plus Jakarta Sans, sans-serif' }
] as const;

export const RADIUS_MAP: Record<ThemeConfig['borderRadius'], string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px'
};

export const COLOR_PALETTE_PRESETS = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark (Default)',
    palette: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      background: '#090d16',
      surface: '#0f172a',
      text: '#f8fafc'
    }
  },
  {
    id: 'emerald-slate',
    name: 'Emerald Slate',
    palette: {
      primary: '#10b981',
      secondary: '#475569',
      background: '#0b111a',
      surface: '#111c2a',
      text: '#f1f5f9'
    }
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    palette: {
      primary: '#2563eb',
      secondary: '#94a3b8',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a'
    }
  }
] as const;

export function generateThemeCssVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--pc-color-primary': theme.colorPalette.primary,
    '--pc-color-secondary': theme.colorPalette.secondary,
    '--pc-color-bg': theme.colorPalette.background,
    '--pc-color-surface': theme.colorPalette.surface,
    '--pc-color-text': theme.colorPalette.text,
    '--pc-font-family': theme.fontFamily,
    '--pc-border-radius': RADIUS_MAP[theme.borderRadius] || '8px'
  };
}
