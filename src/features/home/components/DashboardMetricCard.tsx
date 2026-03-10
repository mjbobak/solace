import React from 'react';

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
        return { bg: 'bg-pink-100', text: 'text-pink-600' };
      case 'expenses':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'budget':
        return { bg: 'bg-indigo-100', text: 'text-indigo-600' };
      case 'savings':
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-indigo-600';
    }
  };

  const colors = getIconColor();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${getTrendColor()}`}>
          {formatValue()}
        </p>
      </div>
    </div>
  );
};
