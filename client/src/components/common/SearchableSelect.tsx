import { useState, useRef, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import './SearchableSelect.css';

interface SelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  label?: string;
  name: string;
  value: string | number | string[] | (string | number)[];
  onChange: (e: { target: { name: string; value: string | number | string[] | (string | number)[] } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  filterOption?: (option: SelectOption, query: string) => boolean;
  multiple?: boolean;
  loading?: boolean;
}

export default function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  required = false,
  disabled = false,
  filterOption = (option, query) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  multiple = false,
  loading = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize the filter function to prevent recreating on every render
  const memoizedFilterOption = useCallback(
    (option: SelectOption, query: string) => filterOption(option, query),
    [filterOption]
  );

  // Filter options based on search query - use useMemo instead of useEffect
  const filteredOptions = useMemo(() => {
    if (searchQuery.trim() === '') {
      return options;
    }
    return options.filter(option => memoizedFilterOption(option, searchQuery));
  }, [searchQuery, options, memoizedFilterOption]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option.value);
      const newValue = isSelected
        ? currentValues.filter((v: string | number) => v !== option.value)
        : [...currentValues, option.value];
      onChange({ target: { name, value: newValue as string[] } });
    } else {
      onChange({ target: { name, value: option.value } });
      setSearchQuery(option.label);
      setIsOpen(false);
    }
  };

  const toggleOption = (option: SelectOption) => {
    handleSelect(option);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setSearchQuery(inputValue);
    setHighlightedIndex(0); // Reset highlight to first item
    // Open dropdown when user starts typing
    if (inputValue.trim() !== '' && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen); // Toggle dropdown
    }
  };

  // Update search query when value changes (for pre-selected values)
  useEffect(() => {
    // Only update if options are available
    if (!options || options.length === 0) {
      return;
    }

    // Don't override search query if user is actively searching
    if (searchQuery.trim() !== '') {
      return;
    }

    // For edit mode: clear search query so all options are visible
    // This allows user to change the unit of measurement
    setSearchQuery('');
  }, [value, options, multiple]);

  // Filter options to show available options
  const availableOptions = useMemo(() =>
    filteredOptions,
    [filteredOptions]
  );

  // Check if option is selected (for multiple mode)
  const isOptionSelected = (optionValue: string | number) => {
    if (!multiple || !Array.isArray(value)) return false;
    return value.some((v: string | number) => v === optionValue);
  };

  // Handle clear all for multiple selection
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ target: { name, value: [] } });
    setSearchQuery('');
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className={`searchable-select ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          onFocus={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className="searchable-select-input"
        />
        {multiple && Array.isArray(value) && value.length > 0 && (
          <button
            type="button"
            className="clear-all-btn"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
        <div className="searchable-select-arrow">▼</div>

        <div className={`searchable-select-dropdown ${isOpen ? 'visible' : ''}`}>
          {loading ? (
            <div className="searchable-select-no-options">
              Loading...
            </div>
          ) : availableOptions.length > 0 ? (
            availableOptions.map((option, index) => (
              <div
                key={option.value}
                className={`searchable-select-option ${index === highlightedIndex ? 'highlighted' : ''} ${isOptionSelected(option.value) ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {multiple ? (
                  <div className="option-content">
                    <span>{option.label}</span>
                    {isOptionSelected(option.value) && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                ) : (
                  option.label
                )}
              </div>
            ))
          ) : (
            <div className="searchable-select-no-options">
              {searchQuery ? 'No options found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
