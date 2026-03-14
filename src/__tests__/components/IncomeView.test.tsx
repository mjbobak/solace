import '@testing-library/jest-dom/vitest';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  IncomeView,
  type IncomeViewHandle,
} from '@/features/income/components/IncomeView';
import type { IncomeYearProjection } from '@/features/income/types/income';

const { getYearProjection, updateYearSettings } = vi.hoisted(() => ({
  getYearProjection: vi.fn(),
  updateYearSettings: vi.fn(),
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
    updateYearSettings,
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

const projection: IncomeYearProjection = {
  year: 2025,
  totals: {
    committedGross: 120000,
    committedNet: 90000,
    plannedGross: 135000,
    plannedNet: 101000,
  },
  emergencyFundBalance: 18000,
  taxAdvantagedInvestments: {
    contributions401k: 22000,
    total: 22000,
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
          },
          currentVersion: {
            id: 21,
            componentId: 11,
            startDate: '2025-01-01',
            endDate: null,
            grossAmount: 4615.38,
            netAmount: 3461.54,
            periodsPerYear: 26,
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
      <IncomeView planningYear={2025} />,
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
    expect(screen.getByText('Tax Advantaged Investments')).toBeInTheDocument();
    expect(screen.getByText('$22,000 401k Contributions')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Acme Corp').closest('button')!);

    const recurringPayHeading = await screen.findByText('Recurring Pay');
    expect(recurringPayHeading).toBeInTheDocument();

    const expandedCell = recurringPayHeading.closest('td');
    expect(expandedCell).toHaveAttribute('colspan', '4');

    const sourceTableHeaders = Array.from(
      container.querySelectorAll(
        '.surface-card > .overflow-x-auto > table > thead > tr > th',
      ),
    ).map((header) => header.textContent?.trim());

    expect(sourceTableHeaders).toEqual([
      'Income Stream',
      'Committed',
      'Planned',
      'Actions',
    ]);
  });

  it('opens the add income modal through the imperative handle', async () => {
    getYearProjection.mockResolvedValue(projection);
    const incomeViewRef = React.createRef<IncomeViewHandle>();

    render(
      <IncomeView ref={incomeViewRef} planningYear={2025} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(),
    );

    act(() => {
      incomeViewRef.current?.openAddIncomeModal();
    });

    expect(
      await screen.findByRole('heading', { name: 'Add Income Source' }),
    ).toBeInTheDocument();
  });

  it('saves the selected year tax advantaged investments from the summary card', async () => {
    getYearProjection.mockResolvedValue(projection);
    updateYearSettings.mockResolvedValue({
      year: 2025,
      contributions401k: 25000,
      emergencyFundBalance: 18000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });

    render(
      <IncomeView planningYear={2025} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const input = await screen.findByLabelText(/401k contributions/i);
    fireEvent.change(input, { target: { value: '25000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Investments' }));

    await waitFor(() =>
      expect(updateYearSettings).toHaveBeenCalledWith(2025, {
        contributions401k: 25000,
      }),
    );
  });
});
