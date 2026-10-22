import { createContext, useContext, type ReactNode } from 'react';

import { colors, fonts, gradients, radii, spacing, typography } from './tokens';

const theme = { colors, fonts, gradients, radii, spacing, typography };

export type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
