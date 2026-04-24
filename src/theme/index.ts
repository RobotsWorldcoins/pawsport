export const Colors = {
  primary: '#FF6B35',       // warm orange
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',
  secondary: '#F5A623',     // golden yellow
  accent: '#4A7C59',        // earthy green
  accentBlue: '#118AB2',    // kept for ArenaScreen sprint config

  background: '#FAF3E0',    // warm beige
  surface: '#FFFFFF',
  surfaceAlt: '#FFF8F0',

  text: '#2C2C2C',          // charcoal
  textSecondary: '#6B6B6B',
  textMuted: '#A0A0A0',
  textInverse: '#FFFFFF',

  border: '#E8DDD0',
  borderLight: '#F0E8DC',

  success: '#4A7C59',
  warning: '#F5A623',
  error: '#E53E3E',
  info: '#3B82F6',

  // Premium tiers
  free: '#A0A0A0',
  silver: '#A8A8A8',
  silverDark: '#888888',
  gold: '#F5A623',
  goldDark: '#D4891A',

  // XP / gamification
  xpBar: '#FF6B35',
  xpBackground: '#FFE8DF',
  streak: '#FF6B35',
  badge: '#F5A623',

  // Tiers
  tierPuppy: '#95E1D3',
  tierJunior: '#81C3D7',
  tierExplorer: '#3D9BE9',
  tierAdventurer: '#6BCB77',
  tierTracker: '#F5A623',
  tierChallenger: '#E94F37',
  tierChampion: '#C77DFF',
  tierElite: '#7B2FBE',
  tierLegend: '#F5A623',
  tierMythic: '#FF6B35',

  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.15)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 36,
  giant: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  }),
};
