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

import { chartPalette, chartTheme } from '@/shared/theme';

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

const DEFAULT_COLORS = chartPalette;

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

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
          margin={margin}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          )}
          {orientation === 'vertical' ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke={chartTheme.axis}
                style={{ fontSize: chartTheme.fontSize }}
              />
              <YAxis
                stroke={chartTheme.axis}
                style={{ fontSize: chartTheme.fontSize }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke={chartTheme.axis}
                style={{ fontSize: chartTheme.fontSize }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke={chartTheme.axis}
                style={{ fontSize: chartTheme.fontSize }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.tooltipBackground,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: chartTheme.tooltipBorderRadius,
              color: chartTheme.tooltipText,
              fontSize: chartTheme.fontSize,
            }}
          />
          {showLegend && (
            <Legend wrapperStyle={{ fontSize: chartTheme.fontSize }} />
          )}
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
