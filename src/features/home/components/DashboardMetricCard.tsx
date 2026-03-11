import React from 'react';

import { statusPalette } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils/currency';

interface DashboardMetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  isPercentage?: boolean;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  category?: 'income' | 'expenses' | 'savings' | 'budget';
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  icon: Icon,
  isPercentage = false,
  isCurrency = true,
  trend = 'neutral',
  category = 'savings',
}) => {
  const formatValue = () => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    if (isCurrency) {
      return formatCurrency(value, '$');
    }
    return value.toString();
  };

  const getIconColor = () => {
    switch (category) {
      case 'income':
        return 'icon-tile icon-tile-success';
      case 'expenses':
        return 'icon-tile icon-tile-danger';
      case 'budget':
        return 'icon-tile icon-tile-brand';
      case 'savings':
      default:
        return 'icon-tile icon-tile-brand';
    }
  };

  const getTrendColor = (): string => {
    switch (trend) {
      case 'up':
        return statusPalette.income;
      case 'down':
        return statusPalette.spending;
      default:
        return statusPalette.budget;
    }
  };

  const colors = getIconColor();

  return (
    <div className="surface-card surface-card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={colors}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-muted">{label}</p>
        <p className="text-3xl font-bold" style={{ color: getTrendColor() }}>
          {formatValue()}
        </p>
      </div>
    </div>
  );
};
