import { createContext, useContext, type ReactNode } from 'react';

import { borders, colors, fonts, gradients, motion, radii, spacing, typography } from './tokens';

const theme = { borders, colors, fonts, gradients, motion, radii, spacing, typography };

export type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
