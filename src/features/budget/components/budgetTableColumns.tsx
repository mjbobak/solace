import { BiRepeat } from 'react-icons/bi';
import { BsInfoCircle } from 'react-icons/bs';
import { LuPencil, LuTrendingUp, LuTrash2 } from 'react-icons/lu';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { isInvestmentBudgetEntry } from '@/features/budget/utils/investmentCategories';
import type { Column } from '@/shared/components/data/Table';
import { Tooltip } from '@/shared/components/Tooltip';
import { formatCurrency } from '@/shared/utils/currency';

interface GetColumnsParams {
  handleEdit: (item: BudgetEntry) => void;
  handleToggleAccrual: (id: string) => void;
  handleDelete: (id: string) => void;
  handleViewSpending: (item: BudgetEntry) => void;
}

function formatRoundedCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getBudgetTableColumns(
  params: GetColumnsParams,
): Column<BudgetEntry>[] {
  const { handleEdit, handleToggleAccrual, handleDelete, handleViewSpending } =
    params;

  return [
    {
      key: 'expenseType',
      header: 'Type',
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            row.expenseType === 'ESSENTIAL'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {row.expenseType}
        </span>
      ),
      sortValue: (row) => row.expenseType,
      sortable: true,
      width: '130px',
    },
    {
      key: 'accrual',
      header: 'Reserve Monthly',
      accessor: (row) => (
        <button
          onClick={() => handleToggleAccrual(row.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            row.isAccrual
              ? 'bg-slate-200 text-slate-900'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={
            row.isAccrual
              ? 'Disable monthly reserve for this budget item'
              : 'Enable monthly reserve for this budget item'
          }
        >
          <BiRepeat size={14} />
          {row.isAccrual ? 'Reserved' : 'Reserve Monthly'}
        </button>
      ),
      sortValue: (row) => (row.isAccrual ? 'Reserved' : 'No monthly reserve'),
      sortable: true,
      width: '170px',
    },
    {
      key: 'expenseCategory',
      header: 'Expense Category',
      accessor: (row) => <span>{row.expenseCategory}</span>,
      sortValue: (row) => row.expenseCategory,
      sortable: true,
      width: '200px',
    },
    {
      key: 'expenseLabel',
      header: 'Expense Label',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="truncate" title={row.expenseLabel}>
            {row.expenseLabel}
          </span>
          {isInvestmentBudgetEntry(row) && (
            <span
              className="inline-flex flex-shrink-0 items-center justify-center text-emerald-600"
              title="Marked as an investment"
              aria-label="Investment item"
            >
              <LuTrendingUp size={14} />
            </span>
          )}
          {row.expenseLabelNote && (
            <Tooltip content={row.expenseLabelNote}>
              <button
                type="button"
                className="inline-flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="View expense label note"
              >
                <BsInfoCircle size={14} />
              </button>
            </Tooltip>
          )}
        </div>
      ),
      sortValue: (row) => row.expenseLabel,
      sortable: true,
      width: '250px',
    },
    {
      key: 'budget',
      header: 'Budget',
      accessor: (row) => (
        <div className="flex flex-col items-end leading-tight">
          <span className="font-semibold">
            {formatRoundedCurrency(row.budgeted * 12)}
            <span className="ml-1 text-xs font-normal text-gray-500">/yr</span>
          </span>
          <span className="text-xs text-gray-500">
            {formatRoundedCurrency(row.budgeted)}
            <span className="ml-1">/mo</span>
          </span>
        </div>
      ),
      sortValue: (row) => row.budgeted * 12,
      sortable: true,
      align: 'right',
      width: '220px',
    },
    {
      key: 'spent',
      header: 'Spent',
      accessor: (row) => (
        <div className="border-l border-gray-300 pl-3">
          <button
            type="button"
            onClick={() => handleViewSpending(row)}
            className="font-medium text-blue-700 transition-colors hover:text-blue-900 hover:underline"
            aria-label={`View transactions for ${row.expenseLabel}`}
            title={`View transactions for ${row.expenseLabel}`}
          >
            {formatRoundedCurrency(row.spent)}
          </button>
        </div>
      ),
      sortValue: (row) => row.spent,
      sortable: true,
      align: 'right',
      width: '110px',
    },
    {
      key: 'remaining',
      header: 'Remaining',
      accessor: (row) => {
        const isNegative = row.remaining < 0;
        const isInvestment = isInvestmentBudgetEntry(row);
        const colorClass = isNegative
          ? isInvestment
            ? 'text-emerald-600'
            : 'text-red-600'
          : 'text-gray-900';

        return (
          <span className={`font-semibold ${colorClass}`}>
            {formatRoundedCurrency(row.remaining)}
          </span>
        );
      },
      sortValue: (row) => row.remaining,
      sortable: true,
      align: 'right',
      width: '110px',
    },
    {
      key: 'percentage',
      header: '% Used',
      accessor: (row) => {
        const isOverBudget = row.remaining < 0;
        const isInvestment = isInvestmentBudgetEntry(row);
        const colorClass = isOverBudget
          ? isInvestment
            ? 'text-emerald-600'
            : 'text-red-600'
          : 'text-gray-900';

        return (
          <span className={`font-semibold ${colorClass}`}>
            {row.percentage.toFixed(0)}%
          </span>
        );
      },
      sortValue: (row) => row.percentage,
      sortable: true,
      align: 'right',
      width: '95px',
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit budget item"
            aria-label={`Edit ${row.expenseLabel}`}
          >
            <LuPencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete budget item"
            aria-label={`Delete ${row.expenseLabel}`}
          >
            <LuTrash2 size={16} />
          </button>
        </div>
      ),
      sortable: false,
      align: 'center',
      width: '100px',
    },
  ];
}
