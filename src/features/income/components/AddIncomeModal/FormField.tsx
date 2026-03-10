/**
 * Reusable form field components for AddIncomeModal
 */

import React from 'react';

// Shared style constants
const INPUT_BASE_CLASS =
  'w-full px-4 py-3 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-900 transition-colors';
const INPUT_FOCUS_CLASS =
  'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 mb-2';

interface FormFieldProps {
  label: string;
  required?: boolean;
  isPrimary?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  isPrimary,
  hint,
  children,
}) => (
  <div>
    <label className={LABEL_CLASS}>
      {label}
      {required && <span className="text-red-500">*</span>}
      {isPrimary && (
        <span className="text-xs text-blue-600 ml-2">(Primary)</span>
      )}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
  step?: string;
  highlighted?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  highlighted,
}) => (
  <input
    type={type}
    step={step}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`${INPUT_BASE_CLASS} ${INPUT_FOCUS_CLASS} ${
      highlighted ? 'border-blue-300 bg-blue-50' : ''
    }`}
  />
);

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string | number; label: string }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  options,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${INPUT_BASE_CLASS} ${INPUT_FOCUS_CLASS}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
    {children}
  </h3>
);
