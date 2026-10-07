export const colors = {
    calcul: '#ec6f1a',
    nombres: '#8b5cf6',
    mesures: '#22c55e',
    geometrie: '#3b82f6',
    logique: '#ec4899',
    ink: '#1f2937',
    paper: '#fffdf7',
    success: '#16a34a',
    danger: '#dc2626',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { md: 16, lg: 24 } as const;
export const themes = ['default', 'nuit', 'doux', 'contraste'] as const;
export type ThemeName = (typeof themes)[number];
