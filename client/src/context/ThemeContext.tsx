import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { Chart } from 'chart.js'

// Available themes
export const THEMES = {
  DEFAULT: 'default',
  DARK: 'dark'
} as const;

export type ThemeType = typeof THEMES[keyof typeof THEMES];

// Theme names for display
export const THEME_NAMES: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: 'Light Mode',
  [THEMES.DARK]: 'Dark Mode'
};

// Theme icons for display
export const THEME_ICONS: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: '',
  [THEMES.DARK]: ''
};

// Theme descriptions
export const THEME_DESCRIPTIONS: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: 'Light mode with clean, professional design',
  [THEMES.DARK]: 'Dark mode for reduced eye strain'
};

interface ThemeContextType {
  currentTheme: ThemeType;
  themeName: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeType) => void;
  themes: typeof THEMES;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// No dynamic CSS loading needed for simple light/dark mode

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Load theme from localStorage or use DEFAULT as default
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('miniERP-theme') as ThemeType | null;
    return saved || THEMES.DEFAULT;
  });

  // Load dark mode from localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('miniERP-darkMode');
    return saved === 'true';
  });

  // Apply theme and dark mode to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    root.classList.remove('theme-default', 'theme-dark');
    body.classList.remove('theme-default', 'theme-dark');

    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    body.classList.add(`theme-${currentTheme}`);

    // Apply dark mode
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      
      // Set Chart.js defaults for dark mode
      Chart.defaults.color = '#9CA3AF';
      Chart.defaults.borderColor = '#4B5563';
      Chart.defaults.backgroundColor = '#1F2937';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      
      // Reset Chart.js defaults for light mode
      Chart.defaults.color = '#374151';
      Chart.defaults.borderColor = '#E5E7EB';
      Chart.defaults.backgroundColor = '#FFFFFF';
    }

    // Save to localStorage
    localStorage.setItem('miniERP-theme', currentTheme);
    localStorage.setItem('miniERP-darkMode', String(isDarkMode));
  }, [currentTheme, isDarkMode]);

  // Toggle between themes
  const toggleTheme = () => {
    const themeOrder: ThemeType[] = [THEMES.DEFAULT, THEMES.DARK];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setCurrentTheme(themeOrder[nextIndex]);
  };

  // Set specific theme
  const setTheme = (theme: ThemeType) => {
    if (Object.values(THEMES).includes(theme)) {
      setCurrentTheme(theme);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const value: ThemeContextType = {
    currentTheme,
    themeName: THEME_NAMES[currentTheme],
    isDarkMode,
    toggleTheme,
    toggleDarkMode,
    setTheme,
    themes: THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
