import React, { useState } from 'react';

import { SankeyChart } from '@/shared/components/charts/SankeyChart';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import { SANKEY_HEIGHT } from '../constants/sankeyConfig';
import { useSankeyData } from '../hooks/useSankeyData';
import type { SankeyPeriod, SankeyViewMode } from '../types/sankeyTypes';

interface SankeyFlowChartProps {
  period?: SankeyPeriod;
  year?: number;
}

export const SankeyFlowChart: React.FC<SankeyFlowChartProps> = ({
  period: externalPeriod,
  year,
}) => {
  const [viewMode, setViewMode] = useState<SankeyViewMode>('top-level');
  const [period, setPeriod] = useState<SankeyPeriod>('monthly');

  // Use external period if provided (from parent component), otherwise use internal state
  const activePeriod = externalPeriod || period;
  const sankeyData = useSankeyData(viewMode, activePeriod, year);

  return (
    <div className="surface-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="page-section-title mb-0">Income & Spending Flow</h3>

        <div className="flex items-center gap-4">
          {!externalPeriod && (
            <ToggleButtonGroup
              value={period}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual' },
              ]}
              onChange={setPeriod}
            />
          )}

          <ToggleButtonGroup
            value={viewMode}
            options={[
              { value: 'top-level', label: 'Top-Level' },
              { value: 'detailed', label: 'Detailed' },
            ]}
            onChange={setViewMode}
          />
        </div>
      </div>

      <SankeyChart data={sankeyData} height={SANKEY_HEIGHT} />
    </div>
  );
};
