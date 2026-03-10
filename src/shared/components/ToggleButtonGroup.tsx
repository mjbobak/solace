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
    outer:
      'inline-flex rounded-full bg-gradient-to-r from-slate-100 to-sky-100 p-[2px] shadow-sm ring-1 ring-slate-200/80',
    inner: 'inline-flex rounded-full bg-white/70 p-[2px] backdrop-blur-sm',
    active:
      'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-white',
    inactive:
      'text-slate-600 hover:text-slate-800 hover:bg-white/60',
  },
  outline: {
    outer:
      'inline-flex rounded-full border border-slate-200 bg-white p-[2px] shadow-sm',
    inner: 'inline-flex rounded-full bg-slate-50/80 p-[2px]',
    active:
      'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-white',
    inactive:
      'text-slate-600 hover:text-slate-900 hover:bg-white',
  },
  pill: {
    outer:
      'inline-flex rounded-full bg-slate-900 p-[2px] shadow-sm ring-1 ring-slate-900/80',
    inner: 'inline-flex rounded-full bg-slate-800 p-[2px]',
    active:
      'bg-cyan-400 text-slate-900 shadow-sm hover:bg-cyan-300 ring-1 ring-cyan-200',
    inactive:
      'text-slate-200 hover:text-white hover:bg-slate-700',
  },
  contrast: {
    outer:
      'inline-flex rounded-full bg-white p-[2px] shadow-sm ring-1 ring-indigo-200',
    inner:
      'inline-flex rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 p-[2px]',
    active:
      'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 ring-1 ring-indigo-500',
    inactive:
      'text-indigo-700 hover:text-indigo-900 hover:bg-white/80',
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
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 ${
            value === option.value
              ? toggleVariantStyles[variant].active
              : toggleVariantStyles[variant].inactive
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
