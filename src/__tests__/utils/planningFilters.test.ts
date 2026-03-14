import { describe, expect, it } from 'vitest';

import { buildPlanningFilterOptions } from '@/shared/utils/planningFilters';

describe('planningFilters utilities', () => {
  it('builds combined options in descending year order', () => {
    expect(
      buildPlanningFilterOptions({
        availableYears: [2024, 2026, 2025, 2026],
        currentYear: 2026,
      }).map((option) => option.label),
    ).toEqual([
      '2026 • Full Year',
      '2026 • Completed Months',
      '2026 • Current Month',
      '2025 • Full Year',
      '2024 • Full Year',
    ]);
  });
});
