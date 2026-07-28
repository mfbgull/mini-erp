import { useState, useRef, useEffect, useCallback, useMemo, ChangeEvent } from 'react';

import { Check } from 'lucide-react';
import '../../styles/components/form.css';

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
  className?: string;
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
  // `query` is only the text the user typed. The selected option's label is
  // derived from `value` — keeping them separate, otherwise the label itself
  // filters the list down to a single entry once something is selected.
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize the filter function to prevent recreating on every render
  const memoizedFilterOption = useCallback(
    (option: SelectOption, query: string) => filterOption(option, query),
    [filterOption]
  );

  // Label of the currently selected option (single-select only)
  const selectedLabel = useMemo(() => {
    if (multiple) return '';
    if (value === '' || value === null || value === undefined) return '';
    return options.find(opt => opt.value === value)?.label ?? String(value);
  }, [value, options, multiple]);

  // Filter only while the user is actively typing
  const filteredOptions = useMemo(() => {
    if (!isSearching || query.trim() === '') {
      return options;
    }
    return options.filter(option => memoizedFilterOption(option, query));
  }, [isSearching, query, options, memoizedFilterOption]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Drop the abandoned query so the selected label shows again
        setIsSearching(false);
        setQuery('');
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
      setQuery('');
      setIsSearching(false);
    } else {
      onChange({ target: { name, value: option.value } });
      setQuery('');
      setIsSearching(false);
      setIsOpen(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsSearching(true);
    setHighlightedIndex(0); // Reset highlight to first item
    if (!isOpen) {
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
        setIsSearching(false);
        setQuery('');
        break;
    }
  };

  const handleInputClick = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      // Opening shows the full list; typing then narrows it
      setIsOpen(true);
      setIsSearching(false);
      setQuery('');
    }
  };

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
    setQuery('');
    setIsSearching(false);
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
          value={isSearching || multiple ? query : selectedLabel}
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
                      <Check className="checkmark" size={16} />
                    )}
                  </div>
                ) : (
                  option.label
                )}
              </div>
            ))
          ) : (
            <div className="searchable-select-no-options">
              {query ? 'No options found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
