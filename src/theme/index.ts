export const Colors = {
  primary: '#FF6B35',
  primaryDark: '#E85A24',
  primaryLight: '#FF8F65',
  secondary: '#FFD166',
  accent: '#06D6A0',
  accentBlue: '#118AB2',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Premium tiers
  free: '#9CA3AF',
  silver: '#C0C0C0',
  silverDark: '#A8A8A8',
  gold: '#FFD700',
  goldDark: '#FFA500',

  // XP / gamification
  xpBar: '#FF6B35',
  xpBackground: '#FFE8DF',
  streak: '#FF6B35',
  badge: '#FFD166',

  // Tiers
  tierPuppy: '#95E1D3',
  tierJunior: '#81C3D7',
  tierExplorer: '#3D9BE9',
  tierAdventurer: '#6BCB77',
  tierTracker: '#F5A623',
  tierChallenger: '#E94F37',
  tierChampion: '#C77DFF',
  tierElite: '#7B2FBE',
  tierLegend: '#FFD700',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};
