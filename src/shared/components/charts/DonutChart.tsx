import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { chartPalette, chartTheme } from '@/shared/theme';

interface ChartDataEntry {
  [key: string]: string | number;
}

interface BaseChartProps {
  data: ChartDataEntry[];
  width?: number | string;
  height?: number;
  isLoading?: boolean;
  error?: string;
}

interface DonutChartProps extends BaseChartProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  ...chartPalette,
  'var(--color-brand)',
  'var(--color-warning)',
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
  innerRadius = 60,
  outerRadius = 80,
  height = 300,
  showLegend = true,
  showPercentage = true,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="chart-empty-state" style={{ height }}>
        <div className="chart-loading-text">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-empty-state" style={{ height }}>
        <div className="text-danger text-sm">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state" style={{ height }}>
        <div className="text-sm text-muted">No data available</div>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce(
    (sum, entry) => sum + Number(entry[dataKey] || 0),
    0,
  );

  // Custom label renderer for percentages
  const renderLabel = (entry: any) => {
    if (!showPercentage) return null;
    const percent = ((Number(entry[dataKey] ?? 0) / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={dataKey}
            nameKey={nameKey}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => {
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} (${percent}%)`, ''];
            }}
            contentStyle={{
              backgroundColor: chartTheme.tooltipBackground,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: chartTheme.tooltipBorderRadius,
              color: chartTheme.tooltipText,
              fontSize: chartTheme.fontSize,
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              wrapperStyle={{ fontSize: chartTheme.fontSize }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
