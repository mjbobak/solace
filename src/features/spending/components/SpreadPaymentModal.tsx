import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  formatSpreadRangeLabel,
  getInclusiveMonthCount,
  getSpreadEndDate,
  getSpreadPaymentConfig,
  monthInputToIsoDate,
  toMonthInputValue,
} from '@/features/spending/utils/spreadPayments';
import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';

interface SpreadPaymentModalProps {
  isOpen: boolean;
  transaction: SpendingEntry | null;
  anchorElement: HTMLButtonElement | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<SpendingEntry>) => Promise<void>;
}

const PRESET_MONTHS = [3, 6, 12] as const;
const VIEWPORT_PADDING = 12;
const POPOVER_GAP = 10;

interface PopoverPosition {
  top: number;
  left: number;
  maxHeight: number;
}

interface MonthRange {
  startMonth: string;
  endMonth: string;
}

interface SpreadPreview {
  spreadStartDate: string;
  spreadMonths: number;
}

function addMonths(monthInput: string, monthsToAdd: number): string {
  const [year, month] = monthInput.split('-').map(Number);
  const result = new Date(year, month - 1 + monthsToAdd, 1);
  const nextYear = result.getFullYear();
  const nextMonth = String(result.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

function getInitialMonthRange(transaction: SpendingEntry): MonthRange {
  const spreadConfig = getSpreadPaymentConfig(transaction);
  const startMonth = spreadConfig
    ? toMonthInputValue(spreadConfig.spreadStartDate)
    : toMonthInputValue(transaction.transactionDate);
  const endMonth = spreadConfig
    ? toMonthInputValue(getSpreadEndDate(spreadConfig))
    : startMonth;

  return { startMonth, endMonth };
}

function getPopoverPosition(params: {
  anchorElement: HTMLButtonElement | null;
  popoverElement: HTMLDivElement | null;
}): PopoverPosition {
  const { anchorElement, popoverElement } = params;

  if (!anchorElement || !popoverElement) {
    return {
      top: VIEWPORT_PADDING,
      left: VIEWPORT_PADDING,
      maxHeight: window.innerHeight - VIEWPORT_PADDING * 2,
    };
  }

  const anchorRect = anchorElement.getBoundingClientRect();
  const popoverRect = popoverElement.getBoundingClientRect();
  const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchorRect.top - VIEWPORT_PADDING;
  const shouldPlaceBelow =
    spaceBelow >= Math.min(popoverRect.height, 320) || spaceBelow >= spaceAbove;

  let top = shouldPlaceBelow
    ? anchorRect.bottom + POPOVER_GAP
    : anchorRect.top - popoverRect.height - POPOVER_GAP;
  let left = anchorRect.left;

  if (left + popoverRect.width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - popoverRect.width - VIEWPORT_PADDING;
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }
  if (top < VIEWPORT_PADDING) {
    top = VIEWPORT_PADDING;
  }

  return {
    top,
    left,
    maxHeight: Math.max(window.innerHeight - top - VIEWPORT_PADDING, 240),
  };
}

export const SpreadPaymentModal: React.FC<SpreadPaymentModalProps> = ({
  isOpen,
  transaction,
  anchorElement,
  onClose,
  onSave,
}) => {
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transaction || !isOpen) {
      return;
    }

    const initialRange = getInitialMonthRange(transaction);
    setStartMonth(initialRange.startMonth);
    setEndMonth(initialRange.endMonth);
  }, [isOpen, transaction]);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
    }
  }, [isOpen]);

  const monthCount = useMemo(() => {
    if (!startMonth || !endMonth) {
      return 0;
    }
    return getInclusiveMonthCount(startMonth, endMonth);
  }, [endMonth, startMonth]);

  const isValidRange = monthCount >= 2;
  const spreadPreview = useMemo<SpreadPreview | null>(() => {
    if (!transaction || !isValidRange) {
      return null;
    }

    return {
      spreadStartDate: monthInputToIsoDate(startMonth),
      spreadMonths: monthCount,
    };
  }, [isValidRange, monthCount, startMonth, transaction]);

  const calculatePosition = useCallback((): PopoverPosition => {
    return getPopoverPosition({
      anchorElement,
      popoverElement: popoverRef.current,
    });
  }, [anchorElement]);

  useEffect(() => {
    if (!isOpen || !anchorElement || !popoverRef.current) {
      return;
    }

    const updatePosition = () => {
      setPosition(calculatePosition());
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorElement, calculatePosition, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) {
        return;
      }
      if (anchorElement?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorElement, isOpen, onClose]);

  const handleSave = async () => {
    if (!transaction || !spreadPreview) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        spreadStartDate: spreadPreview.spreadStartDate,
        spreadMonths: spreadPreview.spreadMonths,
        isAccrual: true,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!transaction) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        spreadStartDate: null,
        spreadMonths: null,
        isAccrual: false,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !transaction) {
    return null;
  }

  const spreadConfig = spreadPreview
    ? {
        spreadStartDate: spreadPreview.spreadStartDate,
        spreadMonths: spreadPreview.spreadMonths,
      }
    : null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`fixed z-50 w-[min(26rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.45)] transition-opacity ${
        position ? 'opacity-100' : 'opacity-0'
      }`}
      style={
        position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              maxHeight: `${position.maxHeight}px`,
            }
          : {
              top: '-9999px',
              left: '-9999px',
            }
      }
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Spread Payment
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Adjust the coverage window without leaving the table.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close spread payment editor"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              {transaction.description}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Charged {transaction.transactionDate}
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-900">
              {formatCurrency(transaction.amount)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Start Month
              </label>
              <input
                type="month"
                value={startMonth}
                onChange={(event) => {
                  const nextStartMonth = event.target.value;
                  setStartMonth(nextStartMonth);
                  if (
                    endMonth &&
                    getInclusiveMonthCount(nextStartMonth, endMonth) < 1
                  ) {
                    setEndMonth(nextStartMonth);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                End Month
              </label>
              <input
                type="month"
                value={endMonth}
                min={startMonth || undefined}
                onChange={(event) => setEndMonth(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 block text-xs font-medium text-slate-600">
              Quick Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_MONTHS.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => {
                    if (!startMonth) {
                      return;
                    }
                    setEndMonth(addMonths(startMonth, months - 1));
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    monthCount === months
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {months} months
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Preview
            </div>
            {spreadConfig ? (
              <div className="mt-2 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {formatSpreadRangeLabel(spreadConfig)}
                </div>
                <div className="text-sm text-slate-600">
                  {monthCount} months total
                </div>
                <div className="text-sm text-slate-600">
                  Average monthly impact:{' '}
                  {formatCurrency(transaction.amount / monthCount)}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-600">
                Choose a start and end month. Spread payments must cover at
                least two months.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div>
              {getSpreadPaymentConfig(transaction) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemove}
                  isLoading={isSaving}
                  className="px-4 py-2 text-xs"
                >
                  Remove Spread
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!isValidRange || isSaving}
                isLoading={isSaving}
                className="px-4 py-2 text-xs"
              >
                Save Spread
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
