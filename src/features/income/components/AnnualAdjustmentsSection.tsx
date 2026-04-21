import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';

import type { AnnualAdjustment } from '../types/income';
import {
  getAnnualAdjustmentStatusLabel,
} from '../types/income';
import {
  OCCURRENCE_STATUS_BADGE_CLASSES,
  formatDate,
} from '../utils/incomeViewFormatters';

interface AnnualAdjustmentsSectionProps {
  adjustments: AnnualAdjustment[];
  onAdd: () => void;
  onEdit: (adjustment: AnnualAdjustment) => void;
  onDelete: (adjustment: AnnualAdjustment) => void;
}

function formatSignedCurrency(amount: number): string {
  if (amount === 0) {
    return formatCurrency(0);
  }

  const prefix = amount > 0 ? '+' : '-';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

function getAmountToneClass(amount: number): string {
  if (amount > 0) {
    return 'text-green-700';
  }

  if (amount < 0) {
    return 'text-red-700';
  }

  return 'text-app';
}

function AnnualAdjustmentsSectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Annual Adjustments
      </p>
      <h3 className="mt-2 text-sm font-semibold text-app">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export function AnnualAdjustmentsSection({
  adjustments,
  onAdd,
  onEdit,
  onDelete,
}: AnnualAdjustmentsSectionProps) {
  if (adjustments.length === 0) {
    return (
      <section className="surface-card space-y-4" aria-label="Annual adjustments">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <AnnualAdjustmentsSectionIntro
            title="Household cash true-ups that sit outside income streams"
            description="Use this for tax refunds, balances due, and other annual reconciliations that should affect planning totals without appearing as employer income."
          />
          <Button onClick={onAdd}>Add Adjustment</Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="surface-card overflow-hidden p-0"
      aria-label="Annual adjustments"
    >
      <div className="border-b section-divider bg-gray-50/80 px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <AnnualAdjustmentsSectionIntro
            title="Year-level cash reconciliations outside employer income"
            description="Use this for tax refunds, balances due, and other annual reconciliations that should affect planning totals without appearing as employer income."
          />
          <Button onClick={onAdd}>Add Adjustment</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[32%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="border-b section-divider bg-white text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Adjustment
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Effective Date
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adjustment) => (
              <tr
                key={adjustment.id}
                className="border-b section-divider align-top last:border-b-0"
              >
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-app">
                    {adjustment.label}
                  </p>
                </td>
                <td className="px-4 py-4 text-sm text-app">
                  {formatDate(adjustment.effectiveDate)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${OCCURRENCE_STATUS_BADGE_CLASSES[adjustment.status]}`}
                  >
                    {getAnnualAdjustmentStatusLabel(adjustment.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`text-sm font-semibold ${getAmountToneClass(
                      adjustment.amount,
                    )}`}
                  >
                    {formatSignedCurrency(adjustment.amount)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                      onClick={() => onEdit(adjustment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1 text-xs"
                      onClick={() => onDelete(adjustment)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
