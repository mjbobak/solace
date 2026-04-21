import '@testing-library/jest-dom/vitest';
import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  IncomeView,
  type IncomeViewHandle,
} from '@/features/income/components/IncomeView';
import type { IncomeYearProjection } from '@/features/income/types/income';

const {
  getYearProjection,
  updateYearSettings,
  createAnnualAdjustment,
  updateAnnualAdjustment,
  deleteAnnualAdjustment,
} = vi.hoisted(() => ({
  getYearProjection: vi.fn(),
  updateYearSettings: vi.fn(),
  createAnnualAdjustment: vi.fn(),
  updateAnnualAdjustment: vi.fn(),
  deleteAnnualAdjustment: vi.fn(),
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
    createAnnualAdjustment,
    updateAnnualAdjustment,
    deleteAnnualAdjustment,
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
    committedCashNet: 90000,
    committedNet: 90000,
    plannedGross: 135000,
    plannedCashNet: 101000,
    plannedNet: 105000,
  },
  emergencyFundBalance: 18000,
  primaryRunwaySourceId: null,
  secondaryRunwaySourceId: null,
  taxAdvantagedInvestments: {
    entries: [
      { bucketType: '401k', annualAmount: 22000 },
      { bucketType: 'hsa', annualAmount: 1000 },
      { bucketType: 'fsa_daycare', annualAmount: 3500 },
      { bucketType: 'fsa_medical', annualAmount: 500 },
    ],
    lockedTotal: 23000,
    spendableTotal: 4000,
    total: 27000,
  },
  annualAdjustmentTotals: {
    committed: 1200,
    planned: 3200,
  },
  annualAdjustments: [
    {
      id: 41,
      year: 2025,
      label: 'Federal tax refund',
      effectiveDate: '2025-02-20',
      status: 'actual',
      amount: 1200,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 42,
      year: 2025,
      label: 'State tax balance due',
      effectiveDate: '2025-04-15',
      status: 'expected',
      amount: -2000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ],
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
        committedCashNet: 90000,
        committedNet: 90000,
        plannedGross: 135000,
        plannedCashNet: 101000,
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
            committedCashNet: 90000,
            committedNet: 90000,
            plannedGross: 120000,
            plannedCashNet: 90000,
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
            committedCashNet: 0,
            committedNet: 0,
            plannedGross: 15000,
            plannedCashNet: 11000,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows tax-advantaged buckets above the source table', async () => {
    getYearProjection.mockResolvedValue(projection);

    render(<IncomeView planningYear={2025} />);

    await waitFor(() =>
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole('columnheader', { name: 'Components' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Current Mix' }),
    ).not.toBeInTheDocument();

    const plannedHeader = screen.getByRole('columnheader', {
      name: 'Gross',
    });
    const netHeader = screen.getByRole('columnheader', {
      name: 'Net',
    });

    expect(screen.getByText('$135,000')).toBeInTheDocument();
    expect(screen.getByText('$105,000')).toBeInTheDocument();
    expect(screen.getAllByText('Tax-Advantaged Buckets')).toHaveLength(2);
    expect(screen.getByText('Income Overview')).toBeInTheDocument();
    expect(screen.getByText('$8,750 / mo')).toBeInTheDocument();
    expect(screen.getByText('$11,250 / mo')).toBeInTheDocument();
    expect(screen.getByText('annual contributions')).toBeInTheDocument();
    expect(screen.getByText('Spendable Restricted')).toBeInTheDocument();
    expect(screen.getByText('$4,000')).toBeInTheDocument();
    expect(screen.getByText('Employer 401k + HSA')).toBeInTheDocument();
    expect(screen.getByText('$23,000')).toBeInTheDocument();
    expect(screen.getByText('2 streams')).toBeInTheDocument();
    expect(screen.getByText('Annual Adjustments')).toBeInTheDocument();
    expect(screen.getByText('+$3,200')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
    expect(
      plannedHeader.compareDocumentPosition(netHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByRole('columnheader', { name: 'Committed' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Acme Corp').closest('button')!);

    const recurringPayHeading = await screen.findByText('Recurring Pay');
    expect(recurringPayHeading).toBeInTheDocument();
    expect(screen.getByText('Current Cash Pay')).toBeInTheDocument();
    expect(screen.getByText('Planned Cash Net')).toBeInTheDocument();

    const expandedCell = recurringPayHeading.closest('td');
    expect(expandedCell).toHaveAttribute('colspan', '4');

    const sourceHeader = screen.getByRole('columnheader', {
      name: 'Source',
    });
    const sourceTable = sourceHeader.closest('table');
    const sourceTableHeaders = Array.from(
      sourceTable?.tHead?.rows[0]?.cells ?? [],
    ).map((header) => header.textContent?.trim());

    expect(sourceTableHeaders).toEqual([
      'Source',
      'Gross',
      'Net',
      '',
    ]);
  });

  it('opens the add income modal through the imperative handle', async () => {
    getYearProjection.mockResolvedValue(projection);
    const incomeViewRef = React.createRef<IncomeViewHandle>();

    render(<IncomeView ref={incomeViewRef} planningYear={2025} />);

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

  it('saves the selected year tax-advantaged buckets from the summary card', async () => {
    getYearProjection.mockResolvedValue(projection);
    updateYearSettings.mockResolvedValue({
      year: 2025,
      taxAdvantagedBuckets: [
        { bucketType: '401k', annualAmount: 25000 },
        { bucketType: 'hsa', annualAmount: 1000 },
        { bucketType: 'fsa_daycare', annualAmount: 3500 },
        { bucketType: 'fsa_medical', annualAmount: 500 },
      ],
      emergencyFundBalance: 18000,
      primaryRunwaySourceId: null,
      secondaryRunwaySourceId: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    });

    render(<IncomeView planningYear={2025} />);

    await waitFor(() =>
      expect(screen.getByText('Acme Corp')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Buckets' }));

    const input = await screen.findByLabelText(/401k annual amount/i);
    fireEvent.change(input, { target: { value: '25000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Buckets' }));

    await waitFor(() =>
      expect(updateYearSettings).toHaveBeenCalledWith(2025, {
        taxAdvantagedBuckets: [
          { bucketType: '401k', annualAmount: 25000 },
          { bucketType: 'hsa', annualAmount: 1000 },
          { bucketType: 'fsa_daycare', annualAmount: 3500 },
          { bucketType: 'fsa_medical', annualAmount: 500 },
        ],
      }),
    );
  });

  it('creates a new annual adjustment from the income page section', async () => {
    getYearProjection.mockResolvedValue(projection);
    createAnnualAdjustment.mockResolvedValue({
      id: 99,
      year: 2025,
      label: 'Estimated tax refund',
      effectiveDate: '2025-03-01',
      status: 'expected',
      amount: 900,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });

    render(<IncomeView planningYear={2025} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    await screen.findByRole('heading', { name: 'Manage Annual Adjustments' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Adjustment' }));

    await screen.findByRole('heading', { name: 'Add Annual Adjustment' });

    fireEvent.change(screen.getByLabelText(/Adjustment label/i), {
      target: { value: 'Estimated tax refund' },
    });
    fireEvent.change(screen.getByLabelText(/Effective date/i), {
      target: { value: '2025-03-01' },
    });
    fireEvent.change(screen.getByLabelText(/^Amount/i), {
      target: { value: '900' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Adjustment' }));

    await waitFor(() =>
      expect(createAnnualAdjustment).toHaveBeenCalledWith({
        year: 2025,
        label: 'Estimated tax refund',
        effectiveDate: '2025-03-01',
        status: 'expected',
        amount: 900,
      }),
    );
  });

  it('updates and deletes annual adjustments', async () => {
    getYearProjection.mockResolvedValue(projection);
    updateAnnualAdjustment.mockResolvedValue({
      ...projection.annualAdjustments[0],
      label: 'Updated refund',
      amount: 1500,
    });
    deleteAnnualAdjustment.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<IncomeView planningYear={2025} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    await screen.findByRole('heading', { name: 'Manage Annual Adjustments' });

    const refundRow = screen.getByText('Federal tax refund').closest('tr');
    expect(refundRow).not.toBeNull();

    fireEvent.click(
      refundRow!.querySelector('button.button-base.button-secondary')!,
    );
    await screen.findByRole('heading', { name: 'Edit Annual Adjustment' });

    fireEvent.change(screen.getByLabelText(/Adjustment label/i), {
      target: { value: 'Updated refund' },
    });
    fireEvent.change(screen.getByLabelText(/^Amount/i), {
      target: { value: '1500' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(updateAnnualAdjustment).toHaveBeenCalledWith(41, {
        label: 'Updated refund',
        effectiveDate: '2025-02-20',
        status: 'actual',
        amount: 1500,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    await screen.findByRole('heading', { name: 'Manage Annual Adjustments' });

    const updatedRefundRow = screen.getByText('Federal tax refund').closest('tr');
    expect(updatedRefundRow).not.toBeNull();

    fireEvent.click(
      updatedRefundRow!.querySelector('button.button-base.button-danger')!,
    );

    await waitFor(() => expect(deleteAnnualAdjustment).toHaveBeenCalledWith(41));
  });
});
