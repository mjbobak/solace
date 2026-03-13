import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { getYearProjection } = vi.hoisted(() => ({
  getYearProjection: vi.fn(),
}));

vi.mock('@/shared/hooks/usePlanningYearSelection', () => ({
  usePlanningYearSelection: () => ({
    availableYears: [2025],
    selectedYear: 2025,
    setSelectedYear: vi.fn(),
  }),
}));

vi.mock('@/shared/components/PlanningYearDropdown', () => ({
  PlanningYearDropdown: () => <div>Planning year dropdown</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/features/income/services/incomeApiService', () => ({
  incomeApiService: {
    getYearProjection,
    createSource: vi.fn(),
    createComponent: vi.fn(),
    createRecurringVersion: vi.fn(),
    updateRecurringVersion: vi.fn(),
    updateSource: vi.fn(),
    createOccurrence: vi.fn(),
    updateComponent: vi.fn(),
    updateOccurrence: vi.fn(),
    deleteRecurringVersion: vi.fn(),
    deleteOccurrence: vi.fn(),
    deleteSource: vi.fn(),
  },
}));

import { IncomeView } from '@/features/income/components/IncomeView';
import type { IncomeYearProjection } from '@/features/income/types/income';

const projection: IncomeYearProjection = {
  year: 2025,
  totals: {
    committedGross: 120000,
    committedNet: 90000,
    plannedGross: 135000,
    plannedNet: 101000,
    committedDeductions: {
      federalTax: 0,
      stateTax: 0,
      fica: 0,
      retirement: 0,
      healthInsurance: 0,
      other: 0,
      total: 0,
    },
    plannedDeductions: {
      federalTax: 0,
      stateTax: 0,
      fica: 0,
      retirement: 0,
      healthInsurance: 0,
      other: 0,
      total: 0,
    },
  },
  sources: [
    {
      id: 1,
      name: 'Acme Corp',
      isActive: true,
      sortOrder: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      totals: {
        committedGross: 120000,
        committedNet: 90000,
        plannedGross: 135000,
        plannedNet: 101000,
        committedDeductions: {
          federalTax: 0,
          stateTax: 0,
          fica: 0,
          retirement: 0,
          healthInsurance: 0,
          other: 0,
          total: 0,
        },
        plannedDeductions: {
          federalTax: 0,
          stateTax: 0,
          fica: 0,
          retirement: 0,
          healthInsurance: 0,
          other: 0,
          total: 0,
        },
      },
      components: [
        {
          id: 11,
          sourceId: 1,
          componentType: 'base_pay',
          componentMode: 'recurring',
          label: 'Base pay',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          totals: {
            committedGross: 120000,
            committedNet: 90000,
            plannedGross: 120000,
            plannedNet: 90000,
            committedDeductions: {
              federalTax: 0,
              stateTax: 0,
              fica: 0,
              retirement: 0,
              healthInsurance: 0,
              other: 0,
              total: 0,
            },
            plannedDeductions: {
              federalTax: 0,
              stateTax: 0,
              fica: 0,
              retirement: 0,
              healthInsurance: 0,
              other: 0,
              total: 0,
            },
          },
          currentVersion: {
            id: 21,
            componentId: 11,
            startDate: '2025-01-01',
            endDate: null,
            grossAmount: 4615.38,
            netAmount: 3461.54,
            periodsPerYear: 26,
            deductions: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          versions: [
            {
              id: 21,
              componentId: 11,
              startDate: '2025-01-01',
              endDate: null,
              grossAmount: 4615.38,
              netAmount: 3461.54,
              periodsPerYear: 26,
              deductions: null,
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
            },
          ],
          occurrences: [],
        },
        {
          id: 12,
          sourceId: 1,
          componentType: 'bonus',
          componentMode: 'occurrence',
          label: 'Annual bonus',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          totals: {
            committedGross: 0,
            committedNet: 0,
            plannedGross: 15000,
            plannedNet: 11000,
            committedDeductions: {
              federalTax: 0,
              stateTax: 0,
              fica: 0,
              retirement: 0,
              healthInsurance: 0,
              other: 0,
              total: 0,
            },
            plannedDeductions: {
              federalTax: 0,
              stateTax: 0,
              fica: 0,
              retirement: 0,
              healthInsurance: 0,
              other: 0,
              total: 0,
            },
          },
          currentVersion: null,
          versions: [],
          occurrences: [
            {
              id: 31,
              componentId: 12,
              status: 'expected',
              plannedDate: '2025-12-15',
              paidDate: null,
              grossAmount: 15000,
              netAmount: 11000,
              deductions: null,
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
            },
          ],
        },
      ],
    },
  ],
};

describe('IncomeView', () => {
  it('shows committed and planned stacked annual income columns in the source table', async () => {
    getYearProjection.mockResolvedValue(projection);

    const { container } = render(
      <MemoryRouter>
        <IncomeView />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole('columnheader', { name: 'Components' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Current Mix' }),
    ).not.toBeInTheDocument();

    const committedHeader = screen.getByRole('columnheader', {
      name: 'Committed',
    });
    const plannedHeader = screen.getByRole('columnheader', {
      name: 'Planned',
    });

    expect(
      committedHeader.compareDocumentPosition(plannedHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByText('$120,000.00')).toBeInTheDocument();
    expect(screen.getByText('$90,000.00 Net')).toBeInTheDocument();
    expect(screen.getByText('$135,000.00')).toBeInTheDocument();
    expect(screen.getByText('$101,000.00 Net')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Acme Corp').closest('button')!);

    const recurringPayHeading = await screen.findByText('Recurring Pay');
    expect(recurringPayHeading).toBeInTheDocument();

    const expandedCell = recurringPayHeading.closest('td');
    expect(expandedCell).toHaveAttribute('colspan', '4');

    const sourceTableHeaders = Array.from(
      container.querySelectorAll('.surface-card > .overflow-x-auto > table > thead > tr > th'),
    ).map((header) => header.textContent?.trim());

    expect(sourceTableHeaders).toEqual([
      'Income Stream',
      'Committed',
      'Planned',
      'Actions',
    ]);
  });
});
