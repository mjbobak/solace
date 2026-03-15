import { describe, expect, it } from 'vitest';

import {
  getFallbackPlanningYear,
  normalizePlanningYear,
  sortPlanningYears,
} from '@/shared/utils/planningYears';

describe('planningYears utilities', () => {
  it('sorts, deduplicates, and ignores years before 2025', () => {
    expect(sortPlanningYears([2026, 2025, 2026, 2024])).toEqual([2025, 2026]);
  });

  it('falls back to the latest available planning year', () => {
    expect(getFallbackPlanningYear([2025, 2026], 2027)).toBe(2026);
  });

  it('uses the requested year when it is available', () => {
    expect(
      normalizePlanningYear({
        requestedYear: 2025,
        availableYears: [2025, 2026],
        fallbackYear: 2026,
      }),
    ).toBe(2025);
  });

  it('falls back when the requested year is unavailable', () => {
    expect(
      normalizePlanningYear({
        requestedYear: 2027,
        availableYears: [2025, 2026],
        fallbackYear: 2026,
      }),
    ).toBe(2026);
  });
});
