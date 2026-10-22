export const colors = {
  night: '#1A1220',
  night2: '#24182B',
  plum: '#5A2D5E',
  plumDeep: '#47224A',
  pearl: '#F3F0F2',
  rose: '#EADADD',
  ink: '#22172A',
  inkSoft: '#5F5266',
  mutedNight: '#BFB3C4',
  gold1: '#B9852A',
  gold2: '#F2D04A',
  goldLine: '#E6BE45',
  goldText: '#8A5A12',
  white: '#FFFFFF',
  success: '#2E7D5B',
  danger: '#A23B4A',
} as const;

export const fonts = {
  display: 'Cormorant_600SemiBold',
  displayRegular: 'Cormorant_400Regular',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemiBold: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontFamily: fonts.display },
  h1: { fontSize: 32, lineHeight: 38, fontFamily: fonts.display },
  h2: { fontSize: 24, lineHeight: 30, fontFamily: fonts.display },
  h3: { fontSize: 20, lineHeight: 26, fontFamily: fonts.display },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.body },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyMedium },
  small: { fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium },
} as const;

export const gradients = {
  gold: ['#B9852A', '#F2D04A'] as const,
  plum: ['#47224A', '#5A2D5E'] as const,
} as const;
