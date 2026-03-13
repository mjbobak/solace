import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/hooks/usePlanningYearSelection', async () => {
  const ReactModule = await import('react');

  return {
    usePlanningYearSelection: () => {
      const [selectedYear, setSelectedYear] = ReactModule.useState(2025);

      return {
        availableYears: [2024, 2025],
        isLoading: false,
        selectedYear,
        setSelectedYear,
      };
    },
  };
});

vi.mock('@/shared/components/PlanningYearDropdown', () => ({
  PlanningYearDropdown: ({
    year,
    years,
    onYearChange,
  }: {
    year: number;
    years: number[];
    onYearChange: (year: number) => void;
  }) => (
    <div>
      <span>Selected year {year}</span>
      {years.map((optionYear) => (
        <button
          key={optionYear}
          type="button"
          onClick={() => onYearChange(optionYear)}
        >
          {optionYear}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/features/dashboard-infographic/components/FinancialHealthSection', () => ({
  FinancialHealthSection: () => <div>Financial Health Section</div>,
}));

vi.mock('@/features/dashboard-infographic/components/SpendingAnalysisSection', () => ({
  SpendingAnalysisSection: () => <div>Spending Analysis Section</div>,
}));

vi.mock('@/features/dashboard-infographic/components/SpendingPulseSection', () => ({
  SpendingPulseSection: () => <div>Spending Pulse Section</div>,
}));

vi.mock('@/features/dashboard-infographic/components/EmergencyRunwaySection', () => ({
  EmergencyRunwaySection: () => <div>Emergency Runway Section</div>,
}));

vi.mock('@/features/dashboard-infographic/components/MoneyFlowSection', () => ({
  MoneyFlowSection: () => <div>Money Flow Section</div>,
}));

vi.mock('@/features/dashboard-infographic/hooks/useDashboardKpiReport', () => ({
  useDashboardKpiReport: (
    year: number,
    _availableYears: number[],
    emergencyFundBalance?: number | null,
  ) => ({
    groups: [
      {
        title: `${year} Report Group`,
        rows: [
          {
            key: `gross-income-${year}`,
            label: 'Gross Income',
            value: { kind: 'currency', amount: year * 1000 },
          },
          {
            key: 'emergency-fund-balance',
            label: 'Emergency Fund Balance',
            value: {
              kind: 'currency',
              amount: emergencyFundBalance ?? 18000,
            },
          },
          {
            key: 'emergency-fund-months',
            label: 'Emergency Fund Months (Emergency Fund / Monthly Expenses)',
            value: {
              kind: 'text',
              text: `${(((emergencyFundBalance ?? 18000) / 3000) || 0).toFixed(1)} months`,
            },
          },
        ],
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

import { DashboardInfographic } from '@/features/dashboard-infographic/components/DashboardInfographic';

describe('DashboardInfographic', () => {
  it('toggles between visual and report modes and keeps the selected year in sync', () => {
    render(
      <MemoryRouter>
        <DashboardInfographic />
      </MemoryRouter>,
    );

    expect(screen.getByText('Financial Health Section')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Wealth Management KPI Report' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));

    expect(
      screen.getByRole('heading', { name: 'Wealth Management KPI Report' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2025 Report Group')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Explain Gross Income' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$2,025,000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18000')).toBeInTheDocument();
    expect(screen.getByText('6.0 months')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Emergency fund balance'), {
      target: { value: '9000' },
    });

    expect(screen.getByDisplayValue('9000')).toBeInTheDocument();
    expect(screen.getByText('3.0 months')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2024' }));

    expect(screen.getByText('Planning year 2024')).toBeInTheDocument();
    expect(screen.getByText('2024 Report Group')).toBeInTheDocument();
    expect(screen.getByText('$2,024,000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Visual' }));

    expect(screen.getByText('Financial Health Section')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Wealth Management KPI Report' }),
    ).not.toBeInTheDocument();
  });
});
