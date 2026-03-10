import React from 'react';
import {
  Sankey as RechartsSankey,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from 'recharts';

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
  const fill = payload?.fill || '#6366f1'; // Default to indigo if no fill specified

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

  if (
    !data ||
    !data.nodes ||
    data.nodes.length === 0 ||
    !data.links ||
    data.links.length === 0
  ) {
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
        <RechartsSankey
          data={data}
          node={<CustomNode />}
          nodePadding={nodePadding}
          margin={margin}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
          />
        </RechartsSankey>
      </ResponsiveContainer>
    </div>
  );
};
