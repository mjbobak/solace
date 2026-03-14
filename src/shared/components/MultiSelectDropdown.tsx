import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LuChevronDown, LuSearch, LuX } from 'react-icons/lu';

import { Input } from '@/shared/components/Input';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  menuAlign?: 'left' | 'right';
  showCheckboxes?: boolean;
  searchPlaceholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  label,
  className = '',
  menuAlign = 'left',
  showCheckboxes = true,
  searchPlaceholder = 'Type to filter...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogTitle = `Select ${label || 'Options'}`;
  const filterAriaLabel = `Filter ${label || 'options'}`;
  const menuPositionClassName = menuAlign === 'right' ? 'right-0' : 'left-0';

  let displayValue = placeholder;
  if (selectedValues.length === 1) {
    displayValue = selectedValues[0];
  } else if (selectedValues.length > 1) {
    displayValue = `${selectedValues.length} selected`;
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query === '') {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const handleToggle = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];
    onChange(newValues);

    if (!showCheckboxes) {
      setIsOpen(false);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleDone = () => {
    setIsOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          {label && <span className="dropdown-label font-medium">{label}</span>}
          <span className="truncate">{displayValue}</span>
        </div>
        <LuChevronDown
          className={`dropdown-icon h-4 w-4 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`dropdown-panel absolute top-full z-50 mt-2 min-w-full w-80 animate-in overflow-hidden fade-in slide-in-from-top-2 duration-200 ${menuPositionClassName}`}
        >
          <div className="dropdown-panel-header sticky top-0 z-10">
            <h3 className="text-app text-sm font-semibold">{dialogTitle}</h3>
            <div className="relative mt-3">
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 pr-16 text-sm"
                aria-label={filterAriaLabel}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                <LuSearch className="h-4 w-4" />
              </span>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10" />
              {searchQuery !== '' && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-2 my-auto h-7 rounded-full px-2 text-muted transition-colors hover:bg-black/5 hover:text-app"
                  aria-label="Clear filter"
                >
                  <LuX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No options available
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No matches for "{searchQuery}"
              </div>
            ) : (
              <div className="p-2">
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option);
                  return (
                    <label
                      key={option}
                      className="dropdown-check-option group"
                      onClick={
                        showCheckboxes
                          ? undefined
                          : () => {
                              handleToggle(option);
                            }
                      }
                    >
                      {showCheckboxes && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(option)}
                          className="checkbox-input"
                        />
                      )}
                      <span className="text-app text-sm transition-colors">
                        {option}
                      </span>
                      {isSelected && <span className="ml-auto text-brand">✓</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {showCheckboxes && selectedValues.length > 0 && (
            <div className="dropdown-panel-header sticky bottom-0 flex gap-2 border-t bg-[color:var(--color-surface-elevated)] px-4 py-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="dropdown-action-secondary flex-1"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="dropdown-action-primary flex-1"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
