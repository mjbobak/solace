import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  menuAlign?: 'left' | 'right';
  showCheckboxes?: boolean;
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get display value
  const displayValue =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} selected`;

  // Close dropdown when clicking outside
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
          <span className="truncate">
            {selectedValues.length > 0 ? displayValue : placeholder}
          </span>
        </div>
        <LuChevronDown
          className={`dropdown-icon h-4 w-4 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`dropdown-panel absolute top-full z-50 mt-2 min-w-full w-80 animate-in overflow-hidden fade-in slide-in-from-top-2 duration-200 ${
            menuAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="dropdown-panel-header sticky top-0 z-10">
            <h3 className="text-app text-sm font-semibold">
              Select {label || 'Options'}
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No options available
              </div>
            ) : (
              <div className="p-2">
                {options.map((option) => {
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
