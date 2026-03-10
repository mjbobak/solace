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
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {label && (
            <span className="text-slate-500 font-medium text-xs">{label}</span>
          )}
          <span className="truncate text-slate-900">
            {selectedValues.length > 0 ? displayValue : placeholder}
          </span>
        </div>
        <LuChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 min-w-full w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
            menuAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 px-4 py-3 border-b border-slate-100 bg-white z-10">
            <h3 className="text-sm font-semibold text-slate-900">
              Select {label || 'Options'}
            </h3>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No options available
              </div>
            ) : (
              <div className="p-2">
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option);
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
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
                          className="w-4 h-4 text-slate-900 bg-white border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 cursor-pointer"
                        />
                      )}
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                        {option}
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-slate-900">✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {showCheckboxes && selectedValues.length > 0 && (
            <div className="sticky bottom-0 border-t border-slate-100 px-4 py-2 bg-white flex gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
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
