import { useTheme, THEMES } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, themeName } = useTheme();

  return (
    <div className="theme-toggle">
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Switch to ${currentTheme === THEMES.ERPNEXT ? 'Default' : 'ERPNext'} theme`}
        aria-label="Toggle theme"
      >
        <span className="theme-toggle-icon">
          {currentTheme === THEMES.ERPNEXT ? '🎨' : '🔷'}
        </span>
        <span className="theme-toggle-label">
          {themeName}
        </span>
        <span className="theme-toggle-indicator" />
      </button>
    </div>
  );
};

export default ThemeToggle;
