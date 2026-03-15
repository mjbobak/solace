import { describe, expect, it } from 'vitest';

import { buildBudgetDrillThroughSearchParams } from '@/shared/utils/budgetDrillThrough';

describe('budget drill-through query builder', () => {
  it('maps full-year drill-through to planning year and exact budget id', () => {
    const searchParams = buildBudgetDrillThroughSearchParams({
      baseSearchParams: new URLSearchParams(
        'planningYear=2025&spendBasis=annual_full_year&q=old',
      ),
      planningYear: 2025,
      spendBasis: 'annual_full_year',
      budgetId: 42,
      currentDate: new Date('2026-03-14T12:00:00Z'),
    });

    expect(searchParams.get('planningYear')).toBe('2025');
    expect(searchParams.get('spendBasis')).toBe('annual_full_year');
    expect(searchParams.get('budgetId')).toBe('42');
    expect(searchParams.getAll('year')).toEqual(['2025']);
    expect(searchParams.getAll('month')).toEqual([]);
    expect(searchParams.get('forceEmpty')).toBeNull();
    expect(searchParams.get('q')).toBeNull();
  });

  it('maps current-month drill-through to the selected planning year and current month', () => {
    const searchParams = buildBudgetDrillThroughSearchParams({
      baseSearchParams: new URLSearchParams(),
      planningYear: 2026,
      spendBasis: 'monthly_current_month',
      budgetId: 7,
      currentDate: new Date('2026-03-14T12:00:00Z'),
    });

    expect(searchParams.getAll('year')).toEqual(['2026']);
    expect(searchParams.getAll('month')).toEqual(['3']);
    expect(searchParams.get('budgetId')).toBe('7');
    expect(searchParams.get('forceEmpty')).toBeNull();
  });

  it('maps completed-months drill-through to months one through the last completed month', () => {
    const searchParams = buildBudgetDrillThroughSearchParams({
      baseSearchParams: new URLSearchParams('account=Checking&page=2'),
      planningYear: 2026,
      spendBasis: 'monthly_avg_elapsed',
      budgetId: 19,
      currentDate: new Date('2026-05-20T12:00:00Z'),
    });

    expect(searchParams.getAll('year')).toEqual(['2026']);
    expect(searchParams.getAll('month')).toEqual(['1', '2', '3', '4']);
    expect(searchParams.get('budgetId')).toBe('19');
    expect(searchParams.get('account')).toBeNull();
    expect(searchParams.get('page')).toBeNull();
    expect(searchParams.get('forceEmpty')).toBeNull();
  });

  it('maps zero completed months to a forced-empty drill-through', () => {
    const searchParams = buildBudgetDrillThroughSearchParams({
      baseSearchParams: new URLSearchParams(),
      planningYear: 2027,
      spendBasis: 'monthly_avg_elapsed',
      budgetId: 88,
      currentDate: new Date('2026-03-14T12:00:00Z'),
    });

    expect(searchParams.get('budgetId')).toBe('88');
    expect(searchParams.getAll('year')).toEqual([]);
    expect(searchParams.getAll('month')).toEqual([]);
    expect(searchParams.get('forceEmpty')).toBe('1');
  });
});
