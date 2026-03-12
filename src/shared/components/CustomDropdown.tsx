import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export interface DropdownOption {
  value: string;
  label: string;
  isAddNew?: boolean;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  onAddNew?: (value: string) => void;
  placeholder?: string;
  labelPrefix?: string;
  className?: string;
  triggerClassName?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  options,
  onChange,
  onAddNew,
  placeholder = 'Select...',
  labelPrefix,
  className = '',
  triggerClassName = '',
  autoFocus = false,
  onBlur,
  onKeyDown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the label for the current value
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsAddingNew(false);
        if (onBlur) onBlur();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  // Auto-focus when component mounts if autoFocus is true
  useEffect(() => {
    if (autoFocus) {
      setIsOpen(true);
    }
  }, [autoFocus]);

  const handleSelect = (optionValue: string, isAddNewOption: boolean) => {
    if (isAddNewOption) {
      setIsAddingNew(true);
      setNewValue('');
    } else {
      onChange(optionValue);
      setIsOpen(false);
      if (onBlur) onBlur();
    }
  };

  const handleAddNewSubmit = () => {
    if (newValue.trim() && onAddNew) {
      onAddNew(newValue.trim());
      onChange(newValue.trim());
      setIsAddingNew(false);
      setIsOpen(false);
      if (onBlur) onBlur();
    }
  };

  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsAddingNew(false);
      if (onBlur) onBlur();
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDownWrapper}
        className={`dropdown-trigger px-3 py-3 ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          {labelPrefix ? (
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="truncate">{labelPrefix}:</span>
              <span className="px-1.5 font-semibold tabular-nums">
                {displayValue}
              </span>
            </span>
          ) : (
            <span className="truncate">{displayValue}</span>
          )}
          <LuChevronDown
            className={`dropdown-icon h-4 w-4 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-panel absolute z-50 mt-1 w-full animate-in overflow-hidden fade-in slide-in-from-top-2 duration-200">
          {isAddingNew ? (
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewSubmit();
                  } else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewValue('');
                  }
                }}
                placeholder="Enter new option..."
                autoFocus
                className="form-input rounded-full text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAddNewSubmit}
                  className="dropdown-action-primary flex-1"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewValue('');
                  }}
                  className="dropdown-action-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div className="max-h-64 overflow-y-auto">
                {options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      handleSelect(option.value, option.isAddNew || false)
                    }
                    className={`dropdown-option w-full ${
                      option.isAddNew
                        ? 'dropdown-option-active font-medium'
                        : option.value === value
                          ? 'dropdown-option-active font-medium'
                          : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
