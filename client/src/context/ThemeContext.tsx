import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Available themes
export const THEMES = {
  DEFAULT: 'default',
  ERPNEXT: 'erpnext',
  ODOO: 'odoo',
  SAP: 'sap'
} as const;

export type ThemeType = typeof THEMES[keyof typeof THEMES];

// Theme names for display
export const THEME_NAMES: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: 'Default Theme',
  [THEMES.ERPNEXT]: 'ERPNext Theme',
  [THEMES.ODOO]: 'Odoo ERP Theme',
  [THEMES.SAP]: 'SAP Fiori Theme'
};

// Theme icons for display
export const THEME_ICONS: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: '',
  [THEMES.ERPNEXT]: '',
  [THEMES.ODOO]: '',
  [THEMES.SAP]: ''
};

// Theme descriptions
export const THEME_DESCRIPTIONS: Record<ThemeType, string> = {
  [THEMES.DEFAULT]: 'Original miniERP styling with flat colors and minimal shadows',
  [THEMES.ERPNEXT]: 'Professional ERPNext-inspired design with gradients and enhanced depth',
  [THEMES.ODOO]: 'Odoo ERP-inspired theme with purple/violet color palette',
  [THEMES.SAP]: 'SAP Fiori-inspired enterprise theme with blue and gold accents'
};

interface ThemeContextType {
  currentTheme: ThemeType;
  themeName: string;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  themes: typeof THEMES;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Load theme from localStorage or use ERPNext as default
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('miniERP-theme') as ThemeType | null;
    // Default to ERPNext theme if no saved preference
    return saved || THEMES.ERPNEXT;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    root.classList.remove('theme-default', 'theme-erpnext', 'theme-odoo', 'theme-sap');
    body.classList.remove('theme-default', 'theme-erpnext', 'theme-odoo', 'theme-sap');

    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    body.classList.add(`theme-${currentTheme}`);

    // Save to localStorage
    localStorage.setItem('miniERP-theme', currentTheme);
  }, [currentTheme]);

  // Toggle between themes
  const toggleTheme = () => {
    const themeOrder: ThemeType[] = [THEMES.DEFAULT, THEMES.ERPNEXT, THEMES.ODOO, THEMES.SAP];
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

  const value: ThemeContextType = {
    currentTheme,
    themeName: THEME_NAMES[currentTheme],
    toggleTheme,
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
