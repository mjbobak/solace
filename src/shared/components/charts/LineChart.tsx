import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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

interface LineChartProps extends BaseChartProps {
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    stroke?: string;
    name?: string;
  }>;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisLabel?: string;
}

const DEFAULT_COLORS = chartPalette;

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisKey,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisLabel,
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

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke={chartTheme.axis}
            style={{ fontSize: chartTheme.fontSize }}
          />
          <YAxis
            stroke={chartTheme.axis}
            style={{ fontSize: chartTheme.fontSize }}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.tooltipBackground,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: chartTheme.tooltipBorderRadius,
              color: chartTheme.tooltipText,
              fontSize: chartTheme.fontSize,
            }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: chartTheme.fontSize }} />}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={
                line.stroke || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
              }
              name={line.name || line.dataKey}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
