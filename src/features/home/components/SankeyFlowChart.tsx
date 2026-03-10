import React, { useState } from 'react';

import { SankeyChart } from '@/shared/components/charts/SankeyChart';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import { SANKEY_HEIGHT } from '../constants/sankeyConfig';
import { useSankeyData } from '../hooks/useSankeyData';
import type { SankeyPeriod, SankeyViewMode } from '../types/sankeyTypes';

interface SankeyFlowChartProps {
  period?: SankeyPeriod;
}

export const SankeyFlowChart: React.FC<SankeyFlowChartProps> = ({
  period: externalPeriod,
}) => {
  const [viewMode, setViewMode] = useState<SankeyViewMode>('top-level');
  const [period, setPeriod] = useState<SankeyPeriod>('monthly');

  // Use external period if provided (from parent component), otherwise use internal state
  const activePeriod = externalPeriod || period;
  const sankeyData = useSankeyData(viewMode, activePeriod);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      {/* Header with title and toggles */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Income & Spending Flow
        </h3>

        <div className="flex items-center gap-4">
          {/* Period Toggle - only show if not controlled by parent */}
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

          {/* View Mode Toggle */}
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

      {/* Sankey Chart */}
      <SankeyChart data={sankeyData} height={SANKEY_HEIGHT} />
    </div>
  );
};
