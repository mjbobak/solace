import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BaseChartProps {
  data: Array<Record<string, unknown>>;
  width?: number | string;
  height?: number;
  isLoading?: boolean;
  error?: string;
}

interface BarChartProps extends BaseChartProps {
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    fill?: string;
    name?: string;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  orientation?: 'vertical' | 'horizontal';
  margin?: { top: number; right: number; left: number; bottom: number };
}

const DEFAULT_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  orientation = 'vertical',
  isLoading = false,
  error,
  margin = { top: 20, right: 30, left: 60, bottom: 20 },
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

  return (
    <div className="w-full bg-white rounded-lg p-4 border border-gray-200">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
          margin={margin}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          {orientation === 'vertical' ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              name={bar.name || bar.dataKey}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
