import { Palette, Diamond, Moon, Sun } from 'lucide-react';

import { useTheme, THEMES } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, themeName, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="theme-toggle-group">
      <div className="theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${currentTheme === THEMES.ERPNEXT ? 'Default' : 'ERPNext'} theme`}
          aria-label="Toggle theme"
        >
          <span className="theme-toggle-icon">
            {currentTheme === THEMES.ERPNEXT ? <Palette size={18} /> : <Diamond size={18} />}
          </span>
          <span className="theme-toggle-label">
            {themeName}
          </span>
          <span className="theme-toggle-indicator" />
        </button>
      </div>
      <div className="dark-mode-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          <span className="theme-toggle-icon">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span className="theme-toggle-label">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
