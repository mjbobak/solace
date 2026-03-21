import React from 'react';

import { SankeyChart } from '@/shared/components/charts/SankeyChart';

import { SANKEY_HEIGHT } from '../constants/sankeyConfig';
import { useSankeyData } from '../hooks/useSankeyData';

interface SankeyFlowChartProps {
  year: number;
}

export const SankeyFlowChart: React.FC<SankeyFlowChartProps> = ({ year }) => {
  const { data, isLoading, error } = useSankeyData(year);

  return (
    <div className="surface-card p-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="page-section-title mb-1">Annual Income Allocation</h3>
          <p className="text-sm text-muted">
            Annual net income split across essentials, funsies, and
            wealth-building, with pre-tax 401(k) dollars from gross income also
            feeding wealth contribution.
          </p>
        </div>
      </div>

      <SankeyChart
        data={data}
        height={SANKEY_HEIGHT}
        isLoading={isLoading}
        error={error ?? undefined}
      />
    </div>
  );
};
