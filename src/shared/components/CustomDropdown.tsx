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
  className?: string;
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
  className = '',
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
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDownWrapper}
        className="w-full px-3 py-3 text-sm text-slate-900 font-medium text-left bg-white border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300"
      >
        <div className="flex items-center justify-between">
          <span className="truncate">{displayValue}</span>
          <LuChevronDown
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {isAddingNew ? (
            // Add new input
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
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 focus:border-transparent"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAddNewSubmit}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewValue('');
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Options list
            <div className="p-2">
              <div className="max-h-64 overflow-y-auto">
                {options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      handleSelect(option.value, option.isAddNew || false)
                    }
                    className={`w-full px-3 py-2.5 text-sm text-left rounded-lg transition-colors ${
                      option.isAddNew
                        ? 'text-slate-900 font-medium bg-slate-100 hover:bg-slate-200'
                        : option.value === value
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-900 hover:bg-slate-50'
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
