import { describe, expect, it } from 'vitest';

import {
  getAvailableSpendBasisOptions,
  normalizeSpendBasisForPlanningYear,
} from '@/shared/utils/spendBasis';

describe('spendBasis utilities', () => {
  it('includes monthly basis options only for the current planning year', () => {
    const currentYear = 2026;

    expect(
      getAvailableSpendBasisOptions(currentYear, currentYear).map(
        (option) => option.value,
      ),
    ).toContain('monthly_current_month');
    expect(
      getAvailableSpendBasisOptions(currentYear, currentYear).map(
        (option) => option.value,
      ),
    ).toContain('monthly_avg_elapsed');

    expect(
      getAvailableSpendBasisOptions(currentYear - 1, currentYear).map(
        (option) => option.value,
      ),
    ).toEqual(['annual_full_year']);
  });

  it('normalizes non-annual basis values back to annual for non-current years', () => {
    const currentYear = 2026;

    expect(
      normalizeSpendBasisForPlanningYear(
        'monthly_current_month',
        currentYear - 1,
        currentYear,
      ),
    ).toBe('annual_full_year');

    expect(
      normalizeSpendBasisForPlanningYear(
        'monthly_avg_elapsed',
        currentYear - 1,
        currentYear,
      ),
    ).toBe('annual_full_year');

    expect(
      normalizeSpendBasisForPlanningYear(
        'monthly_current_month',
        currentYear,
        currentYear,
      ),
    ).toBe('monthly_current_month');

    expect(
      normalizeSpendBasisForPlanningYear(
        'annual_full_year',
        currentYear - 1,
        currentYear,
      ),
    ).toBe('annual_full_year');
  });
});
