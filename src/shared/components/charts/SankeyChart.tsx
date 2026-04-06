import React from 'react';
import {
  Sankey as RechartsSankey,
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
  payload?: {
    name: string;
    fill?: string;
    value?: number;
    depth?: number;
  };
  totalValue?: number;
}

interface LinkProps {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: {
    target?: { fill?: string };
  };
}

const LABEL_WIDTH = 164;
const LABEL_HEIGHT = 62;
const LABEL_GAP = 14;

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0%';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function getTotalFlowValue(
  links: Array<{ source: number; target: number; value: number }>,
): number {
  const incomingTargets = new Set(links.map((link) => link.target));
  const totalsBySource = new Map<number, number>();

  links.forEach((link) => {
    totalsBySource.set(
      link.source,
      (totalsBySource.get(link.source) ?? 0) + link.value,
    );
  });

  return Array.from(totalsBySource.entries()).reduce(
    (rootTotal, [source, total]) =>
      incomingTargets.has(source) ? rootTotal : rootTotal + total,
    0,
  );
}

const CustomNode: React.FC<NodeProps> = (props) => {
  const { x = 0, y = 0, width = 0, height = 0, payload, totalValue } = props;
  const fill = payload?.fill || chartPalette[0];
  const isLeftAnchored = (payload?.depth ?? 0) === 0;
  const centerY = y + height / 2;
  const labelX = isLeftAnchored ? x - LABEL_WIDTH - LABEL_GAP : x + width + LABEL_GAP;
  const labelY = centerY - LABEL_HEIGHT / 2;
  const connectorStartX = isLeftAnchored ? labelX + LABEL_WIDTH : x + width;
  const connectorEndX = isLeftAnchored ? x : labelX;
  const textX = labelX + 12;
  const labelValue = formatCurrency(payload?.value);
  const percentage =
    totalValue && payload?.value ? payload.value / totalValue : isLeftAnchored ? 1 : 0;
  const labelPercentage = formatPercentage(percentage);
  const titleY = isLeftAnchored ? labelY + 26 : labelY + 18;
  const valueY = isLeftAnchored ? labelY + 44 : labelY + 35;

  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={1}
      />

      <line
        x1={connectorStartX}
        y1={centerY}
        x2={connectorEndX}
        y2={centerY}
        stroke={fill}
        strokeWidth={1.25}
        strokeOpacity={0.35}
      />

      <Rectangle
        x={labelX}
        y={labelY}
        width={LABEL_WIDTH}
        height={LABEL_HEIGHT}
        radius={10}
        fill={chartTheme.tooltipBackground}
        fillOpacity={0.42}
        stroke={fill}
        strokeOpacity={0.2}
      />

      <text
        x={textX}
        y={titleY}
        fill={chartTheme.tooltipText}
        fontSize={12}
        fontWeight={600}
      >
        {payload?.name}
      </text>

      <text
        x={textX}
        y={valueY}
        fill={chartTheme.tooltipText}
        fontSize={12}
      >
        {labelValue}
      </text>

      {!isLeftAnchored ? (
        <text
          x={textX}
          y={labelY + 50}
          fill={chartTheme.axis}
          fillOpacity={0.8}
          fontSize={11}
        >
          {labelPercentage} of total
        </text>
      ) : null}
    </g>
  );
};

const CustomLink: React.FC<LinkProps> = (props) => {
  const {
    sourceX = 0,
    targetX = 0,
    sourceY = 0,
    targetY = 0,
    sourceControlX = 0,
    targetControlX = 0,
    linkWidth = 0,
    payload,
  } = props;
  const stroke = payload?.target?.fill || chartPalette[0];

  return (
    <path
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke={stroke}
      strokeWidth={linkWidth}
      strokeOpacity={0.45}
      strokeLinecap="butt"
    />
  );
};

export const SankeyChart: React.FC<SankeyChartProps> = ({
  data,
  height = 400,
  nodePadding = 20,
  margin = { top: 20, right: 200, bottom: 20, left: 200 },
  isLoading = false,
  error,
}) => {
  const totalFlowValue = getTotalFlowValue(data.links);

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
          node={(nodeProps) => (
            <CustomNode {...nodeProps} totalValue={totalFlowValue} />
          )}
          link={<CustomLink />}
          nodePadding={nodePadding}
          margin={margin}
        />
      </ResponsiveContainer>
    </div>
  );
};
