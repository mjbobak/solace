import { LuPencil, LuTrash2 } from 'react-icons/lu';

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { hasSpreadPayment } from '@/features/spending/utils/spreadPayments';
import type { Column } from '@/shared/components/data/Table';
import { Tooltip } from '@/shared/components/Tooltip';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateOnly } from '@/shared/utils/dateOnly';

import { SpreadPaymentCell } from './SpreadPaymentCell';

interface GetColumnsParams {
  handleEditSpread: (
    transaction: SpendingEntry,
    anchorElement: HTMLButtonElement,
  ) => void;
  handleEdit: (transaction: SpendingEntry) => void;
  handleDelete: (id: string) => void;
  displayMonth?: {
    year: number;
    month: number;
    label: string;
  } | null;
}

export function getSpendingTableColumns(
  params: GetColumnsParams,
): Column<SpendingEntry>[] {
  const { handleEditSpread, handleEdit, handleDelete, displayMonth = null } =
    params;

  return [
    {
      key: 'account',
      header: 'Account',
      accessor: (row) => <span>{row.account}</span>,
      sortValue: (row) => row.account,
      sortable: true,
      width: '150px',
    },
    {
      key: 'transactionDate',
      header: 'Transaction Date',
      accessor: (row) => <span>{formatDateOnly(row.transactionDate)}</span>,
      sortValue: (row) => row.transactionDate,
      sortable: true,
      width: '140px',
    },
    {
      key: 'postDate',
      header: 'Post Date',
      accessor: (row) => <span>{formatDateOnly(row.postDate)}</span>,
      sortValue: (row) => row.postDate,
      sortable: true,
      width: '120px',
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (row) => (
        <Tooltip content={row.description}>
          <span className="block truncate max-w-[200px]">
            {row.description}
          </span>
        </Tooltip>
      ),
      sortValue: (row) => row.description,
      sortable: true,
      width: '200px',
    },
    {
      key: 'budgetLabel',
      header: 'Budget Item',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.budgetLabel}</div>
          {row.budgetCategory && (
            <div className="text-xs text-gray-500">
              {row.budgetCategory} • {row.budgetType}
            </div>
          )}
        </div>
      ),
      sortValue: (row) => row.budgetLabel,
      sortable: true,
      width: '180px',
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (row) => <span>{formatCurrency(row.amount)}</span>,
      sortValue: (row) => row.amount,
      sortable: true,
      align: 'right',
      width: '75px',
    },
    {
      key: 'accrual',
      header: 'Spread Payment',
      accessor: (row) => (
        <SpreadPaymentCell
          transaction={row}
          onEdit={handleEditSpread}
          displayMonth={displayMonth}
        />
      ),
      sortValue: (row) => (hasSpreadPayment(row) ? 'Payment spread' : 'Not spread'),
      sortable: true,
      width: '210px',
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit transaction"
            aria-label={`Edit ${row.description}`}
          >
            <LuPencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete transaction"
            aria-label={`Delete ${row.description}`}
          >
            <LuTrash2 size={16} />
          </button>
        </div>
      ),
      sortable: false,
      align: 'center',
      width: '80px',
    },
  ];
}
