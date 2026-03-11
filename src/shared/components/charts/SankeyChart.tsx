import React from 'react';
import {
  Sankey as RechartsSankey,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from 'recharts';

import { chartPalette, chartTheme } from '@/shared/theme';

interface SankeyChartProps {
  data: {
    nodes: Array<{ name: string; fill?: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  };
  width?: number | string;
  height?: number;
  isLoading?: boolean;
  error?: string;
  nodePadding?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

// Custom node component that respects the fill color from node data
interface NodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name: string; fill?: string };
  contentX?: number;
  contentY?: number;
  contentWidth?: number;
  contentHeight?: number;
}

const CustomNode: React.FC<NodeProps> = (props) => {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const fill = payload?.fill || chartPalette[0];

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={1}
    />
  );
};

export const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  height = 400,
  nodePadding = 20,
  margin = { top: 20, right: 160, bottom: 20, left: 20 },
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

  if (
    !data ||
    !data.nodes ||
    data.nodes.length === 0 ||
    !data.links ||
    data.links.length === 0
  ) {
    return (
      <div className="chart-empty-state" style={{ height }}>
        <div className="text-sm text-muted">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsSankey
          data={data}
          node={<CustomNode />}
          nodePadding={nodePadding}
          margin={margin}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.tooltipBackground,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: chartTheme.tooltipBorderRadius,
              color: chartTheme.tooltipText,
              fontSize: chartTheme.fontSize,
            }}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
          />
        </RechartsSankey>
      </ResponsiveContainer>
    </div>
  );
};
