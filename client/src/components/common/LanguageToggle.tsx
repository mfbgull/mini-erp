import { Languages } from 'lucide-react';

import { useTranslation } from '../../hooks/useTranslation';

import './LanguageToggle.css';

interface LanguageToggleProps {
  showLabel?: boolean;
}

const LanguageToggle = ({ showLabel = true }: LanguageToggleProps) => {
  const { locale, setLocale, isRTL } = useTranslation();

  const handleToggle = () => {
    const newLocale = locale === 'en' ? 'ur' : 'en';
    setLocale(newLocale);
    localStorage.setItem('minierp_locale', newLocale);
  };

  return (
    <button
      type="button"
      className={`language-toggle ${isRTL ? 'rtl' : 'ltr'}`}
      onClick={handleToggle}
      title={isRTL ? 'Switch to English' : 'اردو میں تبدیل کریں'}
    >
      <Languages size={18} strokeWidth={1.5} className="language-icon" />
      {showLabel && (
        <span className="language-label">
          {locale === 'en' ? 'EN' : 'UR'}
        </span>
      )}
    </button>
  );
};

export default LanguageToggle;