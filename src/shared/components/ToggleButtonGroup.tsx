import React from 'react';

interface ToggleOption<T = string> {
  value: T;
  label: string;
}

interface ToggleButtonGroupProps<T = string> {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  variant?: 'soft' | 'outline' | 'pill' | 'contrast';
}

type ToggleVariant = NonNullable<ToggleButtonGroupProps['variant']>;

const toggleVariantStyles: Record<
  ToggleVariant,
  {
    outer: string;
    inner: string;
    active: string;
    inactive: string;
  }
> = {
  soft: {
    outer: 'toggle-group',
    inner: 'toggle-group-inner',
    active: 'toggle-option toggle-option-active',
    inactive: 'toggle-option',
  },
  outline: {
    outer: 'toggle-group',
    inner: 'toggle-group-inner',
    active: 'toggle-option toggle-option-active',
    inactive: 'toggle-option',
  },
  pill: {
    outer: 'toggle-group toggle-group-pill',
    inner: 'toggle-group-inner',
    active: 'toggle-option toggle-option-active',
    inactive: 'toggle-option',
  },
  contrast: {
    outer: 'toggle-group toggle-group-contrast',
    inner: 'toggle-group-inner',
    active: 'toggle-option toggle-option-active',
    inactive: 'toggle-option',
  },
};

export const ToggleButtonGroup = <T = string,>({
  value,
  options,
  onChange,
  className = '',
  variant = 'outline',
}: ToggleButtonGroupProps<T>): React.ReactElement => (
  <div className={`${toggleVariantStyles[variant].outer} ${className}`}>
    <div className={toggleVariantStyles[variant].inner}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={
            value === option.value
              ? toggleVariantStyles[variant].active
              : toggleVariantStyles[variant].inactive
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
