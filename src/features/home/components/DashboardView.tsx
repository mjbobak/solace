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
      {/* Visualization Toggle - Centered */}
      <div className="flex justify-center">
        <ToggleButtonGroup
          value={visualizationType}
          options={visualizationOptions}
          onChange={setVisualizationType}
        />
      </div>
      {/* Metric Cards - Always show */}
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

      {/* Comprehensive View - All visualizations */}
      {visualizationType === 'comprehensive' && (
        <>
          {/* Spending Chart - Full width */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: '#6366f1', name: 'Budget' },
                { dataKey: 'Actual', fill: '#10b981', name: 'Actual Spending' },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          {/* Savings Trend and Category Breakdown - 2 column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Trend */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Savings Trend
              </h3>
              <LineChart
                data={savingsData}
                xAxisKey="month"
                lines={[
                  { dataKey: 'savings', stroke: '#10b981', name: 'Savings' },
                ]}
                height={300}
                showGrid
                showLegend
              />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
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

          {/* Income & Spending Flow - Full width */}
          <SankeyFlowChart />
        </>
      )}

      {/* Spending View */}
      {visualizationType === 'spending' && (
        <>
          {/* Spending Chart - Full width */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: '#6366f1', name: 'Budget' },
                { dataKey: 'Actual', fill: '#10b981', name: 'Actual Spending' },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
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

      {/* Budget View */}
      {visualizationType === 'budget' && (
        <>
          {/* Spending Chart - Full width */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Spending vs Budget
            </h3>
            <BarChart
              data={spendingData}
              xAxisKey="month"
              bars={[
                { dataKey: 'Budget', fill: '#6366f1', name: 'Budget' },
                { dataKey: 'Actual', fill: '#10b981', name: 'Actual Spending' },
              ]}
              height={300}
              showGrid
              showLegend
            />
          </div>

          {/* Income & Spending Flow - Full width */}
          <SankeyFlowChart />
        </>
      )}
    </div>
  );
};
