import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, themeName, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="theme-toggle-group">
      <div className="theme-toggle">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${currentTheme === 'default' ? 'Dark' : 'Light'} mode`}
          aria-label="Toggle theme"
        >
          <span className="theme-toggle-icon">
            {currentTheme === 'default' ? '☀️' : '🌙'}
          </span>
          <span className="theme-toggle-label">
            {themeName}
          </span>
          <span className="theme-toggle-indicator" />
        </button>
      </div>
      <div className="dark-mode-toggle">
        <button
          type="button"
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
