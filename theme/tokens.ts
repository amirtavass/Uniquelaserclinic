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
  // M1 token delta (docs/ui/01-tokens.md §5) — values VERIFIED from live ulc-signature CSS:
  statusOpen: '#7FD69A', // site `.status i` open dot + halo
  noticeText: '#F3E6C4', // announcement-bar text on plum-deep
  articleInk: '#3B3042', // .ulc-prose body copy
} as const;

// M1 delta: hairline + motion tokens extracted from the site :root (docs/ui/01-tokens.md §3).
export const borders = {
  line: 'rgba(34,23,42,.14)',
  lineNight: 'rgba(243,240,242,.16)',
} as const;

export const motion = {
  // CSS cubic-bezier control points — apply via Animated/Easing.bezier(x1,y1,x2,y2).
  eOut: [0.16, 1, 0.3, 1],
  eIO: [0.65, 0, 0.35, 1],
  fast: 150,
  base: 200,
  slow: 250,
} as const;

export const fonts = {
  display: 'Cormorant_600SemiBold',
  displayMedium: 'Cormorant_500Medium',
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
