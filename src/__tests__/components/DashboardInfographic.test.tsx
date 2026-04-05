import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { DashboardInfographic } from '@/features/dashboard-infographic/components/DashboardInfographic';

const { updateYearSettings } = vi.hoisted(() => ({
  updateYearSettings: vi.fn(),
}));

vi.mock(
  '@/features/dashboard-infographic/components/FinancialHealthSection',
  () => ({
    FinancialHealthSection: () => <div>Financial Health Section</div>,
  }),
);

vi.mock(
  '@/features/dashboard-infographic/components/SpendingPulseSection',
  () => ({
    SpendingPulseSection: () => <div>Spending Pulse Section</div>,
  }),
);

vi.mock(
  '@/features/dashboard-infographic/components/EmergencyRunwaySection',
  () => ({
    EmergencyRunwaySection: () => <div>Emergency Runway Section</div>,
  }),
);

vi.mock('@/features/dashboard-infographic/components/MoneyFlowSection', () => ({
  MoneyFlowSection: () => <div>Money Flow Section</div>,
}));

vi.mock('@/features/dashboard-infographic/hooks/useDashboardKpiReport', () => ({
  useDashboardKpiReport: (
    year: number,
    _availableYears: number[],
    _spendBasis: string,
    emergencyFundBalance?: number | null,
  ) => ({
    groups: [
      {
        title: `${year} Report Group`,
        rows: [
          {
            key: `gross-income-${year}`,
            label: 'Gross Income',
            actualValue: { kind: 'currency', amount: year * 1000 },
            benchmark: 'Strong: stable or growing year over year.',
          },
          {
            key: 'emergency-fund-balance',
            label: 'Emergency Fund Balance',
            actualValue: {
              kind: 'currency',
              amount: emergencyFundBalance ?? 18000,
            },
            benchmark: 'Strong: enough cash to cover 3-6 months of essentials.',
          },
          {
            key: 'emergency-fund-months',
            label: 'Emergency Fund Months (Emergency Fund / Monthly Expenses)',
            actualValue: {
              kind: 'text',
              text: `${((emergencyFundBalance ?? 18000) / 3000 || 0).toFixed(
                1,
              )} months`,
            },
            benchmark: 'Strong: 3-6 months minimum, 6+ very solid.',
          },
        ],
      },
    ],
    savedEmergencyFundBalance: 18000,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/income/services/incomeApiService', () => ({
  incomeApiService: {
    updateYearSettings,
  },
}));

describe('DashboardInfographic', () => {
  it('toggles between visual and report modes and keeps the selected year in sync', async () => {
    updateYearSettings.mockResolvedValue({
      year: 2025,
      taxAdvantagedBuckets: [],
      emergencyFundBalance: 9000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });

    render(
      <MemoryRouter>
        <DashboardInfographic
          year={2025}
          availableYears={[2024, 2025]}
          spendBasis="monthly_avg_elapsed"
          mode="report"
          onModeChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Wealth Management KPI Report' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2025 Report Group')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Explain Gross Income' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$2,025,000')).toBeInTheDocument();
    expect(screen.getByText('Strong Looks Like')).toBeInTheDocument();
    expect(
      screen.getByText('Strong: stable or growing year over year.'),
    ).toBeInTheDocument();
    expect(screen.getByText('$18,000')).toBeInTheDocument();
    expect(screen.getByText('6.0 months')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Edit emergency fund balance' }),
    );

    expect(screen.getByDisplayValue('18000')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Emergency fund balance'), {
      target: { value: '9000' },
    });

    expect(screen.getByDisplayValue('9000')).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText('Emergency fund balance'));

    await waitFor(() => expect(screen.getByText('$9,000')).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText('3.0 months')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(updateYearSettings).toHaveBeenCalledWith(2025, {
        emergencyFundBalance: 9000,
      }),
    );
  });

  it('renders visual mode content when requested', () => {
    render(
      <MemoryRouter>
        <DashboardInfographic
          year={2025}
          availableYears={[2024, 2025]}
          spendBasis="monthly_avg_elapsed"
          mode="visual"
          onModeChange={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Financial Health Section')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Wealth Management KPI Report' }),
    ).not.toBeInTheDocument();
  });
});
