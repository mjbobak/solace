import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
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
  /** Formats raw values in the tooltip (e.g. currency). Defaults to String(). */
  valueFormatter?: (value: number) => string;
  /** Big value shown in the donut hole (pre-formatted). Pairs with showLegend={false}. */
  centerValue?: string;
  /** Caption under centerValue. */
  centerLabel?: string;
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
  valueFormatter,
  centerValue,
  centerLabel,
  isLoading = false,
  error,
}) => {
  const formatValue = valueFormatter ?? ((value: number) => String(value));
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
  const renderLabel = (entry: PieLabelRenderProps) => {
    if (!showPercentage) return null;
    const value = (entry as unknown as Record<string, unknown>)[dataKey];
    const percent = ((Number(value ?? 0) / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className="chart-shell">
      <div style={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
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
              return [`${formatValue(value)} (${percent}%)`, ''];
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
      {centerValue !== undefined ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--color-text)',
            }}
          >
            {centerValue}
          </span>
          {centerLabel ? (
            <span
              style={{
                marginTop: 2,
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {centerLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      </div>
    </div>
  );
};
