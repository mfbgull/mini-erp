import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

interface SearchProviderProps {
  children: ReactNode;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Escape to close search
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <SearchContext.Provider value={{ isSearchOpen, openSearch, closeSearch }}>
      {children}
      {isSearchOpen && (
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
            {/* Search modal content will be rendered in App or Layout */}
          </div>
        </div>
      )}
    </SearchContext.Provider>
  );
};
