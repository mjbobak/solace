import React from 'react';

import { formatCurrency } from '@/shared/utils/currency';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'percent';
  icon: React.ReactNode;
  variant?: 'default' | 'positive' | 'warning' | 'negative';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  format = 'currency',
  icon,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    // Use white background with colored borders for status variants
    switch (variant) {
      case 'positive':
        return 'border-emerald-200 bg-white text-emerald-700';
      case 'warning':
        return 'border-indigo-200 bg-white text-indigo-700';
      case 'negative':
        return 'border-rose-200 bg-white text-rose-700';
      default:
        return 'border-gray-200 bg-white text-gray-900';
    }
  };

  const formatValue = () => {
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    return formatCurrency(value, '$');
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${getVariantStyles()} transition-all hover:shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4 flex items-center justify-center opacity-60">
          {icon}
        </div>
        <span className="text-xs font-medium opacity-60 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold">{formatValue()}</div>
    </div>
  );
};
