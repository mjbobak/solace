import { describe, expect, it } from 'vitest';

import {
  formatDateOnly,
  getMonthIndexFromDateOnly,
  getYearFromDateOnly,
  parseDateOnly,
  toDateOnlyString,
} from '@/shared/utils/dateOnly';
import { isTransactionInRange } from '@/shared/utils/spendingAggregation';

describe('dateOnly utilities', () => {
  it('parses date-only strings as local calendar dates', () => {
    const parsed = parseDateOnly('2026-01-01');

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(1);
  });

  it('formats and extracts parts without shifting to the prior day', () => {
    expect(formatDateOnly('2026-01-01', 'en-US')).toBe('1/1/2026');
    expect(getYearFromDateOnly('2026-01-01')).toBe(2026);
    expect(getMonthIndexFromDateOnly('2026-01-01')).toBe(0);
  });

  it('serializes local dates back to YYYY-MM-DD', () => {
    expect(toDateOnlyString(new Date(2026, 0, 1, 23, 45))).toBe('2026-01-01');
  });

  it('keeps boundary dates in the correct month range', () => {
    expect(
      isTransactionInRange(
        '2026-01-01',
        new Date(2026, 0, 1),
        new Date(2026, 0, 31),
      ),
    ).toBe(true);

    expect(
      isTransactionInRange(
        '2026-01-01',
        new Date(2025, 11, 31),
        new Date(2025, 11, 31),
      ),
    ).toBe(false);
  });
});
