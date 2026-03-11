import React, { useState } from 'react';
import {
  LuWallet,
  LuTrendingDown,
  LuPiggyBank,
  LuPercent,
} from 'react-icons/lu';

import { BarChart } from '@/shared/components/charts/BarChart';
import { DonutChart } from '@/shared/components/charts/DonutChart';
import { LineChart } from '@/shared/components/charts/LineChart';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { statusPalette } from '@/shared/theme';

import {
  spendingData,
  savingsData,
  categoryData,
  dashboardMetrics,
} from '../services/mockDashboardData';

import { DashboardMetricCard } from './DashboardMetricCard';
import { SankeyFlowChart } from './SankeyFlowChart';

type VisualizationType = 'comprehensive' | 'spending' | 'budget';

export const DashboardView: React.FC = () => {
  const [visualizationType, setVisualizationType] =
    useState<VisualizationType>('comprehensive');

  const visualizationOptions = [
    { value: 'comprehensive' as const, label: 'Comprehensive' },
    { value: 'spending' as const, label: 'Spending' },
    { value: 'budget' as const, label: 'Budget' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ToggleButtonGroup
          value={visualizationType}
          options={visualizationOptions}
          onChange={setVisualizationType}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard
          label="Total Balance"
          value={dashboardMetrics.totalBalance}
          icon={LuWallet}
          isCurrency
          trend="up"
        />
        <DashboardMetricCard
          label="Monthly Spending"
          value={dashboardMetrics.monthlySpending}
          icon={LuTrendingDown}
          isCurrency
          trend="neutral"
        />
        <DashboardMetricCard
          label="Monthly Savings"
          value={dashboardMetrics.monthlySavings}
          icon={LuPiggyBank}
          isCurrency
          trend="up"
        />
        <DashboardMetricCard
          label="Savings Rate"
          value={dashboardMetrics.savingsRate}
          icon={LuPercent}
          isPercentage
          isCurrency={false}
          trend="up"
        />
      </div>

      {visualizationType === 'comprehensive' && (
        <>
          <div className="surface-card">
            <h3 className="page-section-title">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: statusPalette.budget, name: 'Budget' },
                {
                  dataKey: 'Actual',
                  fill: statusPalette.income,
                  name: 'Actual Spending',
                },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="surface-card">
              <h3 className="page-section-title">
                Savings Trend
              </h3>
              <LineChart
                data={savingsData}
                xAxisKey="month"
                lines={[
                  {
                    dataKey: 'savings',
                    stroke: statusPalette.income,
                    name: 'Savings',
                  },
                ]}
                height={300}
                showGrid
                showLegend
              />
            </div>

            <div className="surface-card">
              <h3 className="page-section-title">
                Spending by Category
              </h3>
              <DonutChart
                data={categoryData}
                dataKey="value"
                nameKey="name"
                height={300}
                showLegend
                showPercentage
              />
            </div>
          </div>

          <SankeyFlowChart />
        </>
      )}

      {visualizationType === 'spending' && (
        <>
          <div className="surface-card">
            <h3 className="page-section-title">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: statusPalette.budget, name: 'Budget' },
                {
                  dataKey: 'Actual',
                  fill: statusPalette.income,
                  name: 'Actual Spending',
                },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          <div className="surface-card">
            <h3 className="page-section-title">
              Spending by Category
            </h3>
            <DonutChart
              data={categoryData}
              dataKey="value"
              nameKey="name"
              height={300}
              showLegend
              showPercentage
            />
          </div>
        </>
      )}

      {visualizationType === 'budget' && (
        <>
          <div className="surface-card">
            <h3 className="page-section-title">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: statusPalette.budget, name: 'Budget' },
                {
                  dataKey: 'Actual',
                  fill: statusPalette.income,
                  name: 'Actual Spending',
                },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          <SankeyFlowChart />
        </>
      )}
    </div>
  );
};
