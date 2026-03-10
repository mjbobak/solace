/**
 * Main orchestrator component for the financial infographic dashboard
 * Manages global state (period) and renders all sections
 */

import React, { useState } from 'react';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import type { Period } from '../types/infographic';

import { EmergencyRunwaySection } from './EmergencyRunwaySection';
import { FinancialHealthSection } from './FinancialHealthSection';
import { MoneyFlowSection } from './MoneyFlowSection';
import { SpendingAnalysisSection } from './SpendingAnalysisSection';
import { SpendingPulseSection } from './SpendingPulseSection';

export const DashboardInfographic: React.FC = () => {
  const [period, setPeriod] = useState<Period>('monthly');

  return (
    <div>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 bg-white rounded-2xl shadow-lg">
        {/* Period Toggle */}
        <div className="py-12">
          <ToggleButtonGroup
            options={[
              { value: 'monthly' as const, label: 'Monthly' },
              { value: 'annual' as const, label: 'Annual' },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </div>

        {/* Financial Health Section */}
        <div id="financial-health">
          <FinancialHealthSection period={period} />
        </div>

        {/* Spending Analysis Section */}
        <div id="spending-analysis">
          <SpendingAnalysisSection period={period} />
        </div>

        {/* Spending Pulse Section */}
        <div id="spending-pulse">
          <SpendingPulseSection period={period} />
        </div>

        {/* Emergency Runway Section */}
        <div id="emergency-runway">
          <EmergencyRunwaySection period={period} />
        </div>

        {/* Money Flow Section */}
        <div id="money-flow">
          <MoneyFlowSection period={period} />
        </div>
      </main>

      {/* Bottom padding for comfortable scrolling */}
      <div className="h-20" />
    </div>
  );
};
