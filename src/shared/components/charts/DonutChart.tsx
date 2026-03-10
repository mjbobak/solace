import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  '#6366f1', // Indigo
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
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
      <div
        className="flex items-center justify-center bg-white rounded-lg border border-gray-200"
        style={{ height }}
      >
        <div className="text-gray-400">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-white rounded-lg border border-gray-200"
        style={{ height }}
      >
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white rounded-lg border border-gray-200"
        style={{ height }}
      >
        <div className="text-gray-400 text-sm">No data available</div>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce(
    (sum, entry) => sum + Number(entry[dataKey] || 0),
    0,
  );

  // Custom label renderer for percentages
  const renderLabel = (entry: ChartDataEntry) => {
    if (!showPercentage) return null;
    const percent = ((entry[dataKey] / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className="w-full bg-white rounded-lg p-4 border border-gray-200">
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
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
