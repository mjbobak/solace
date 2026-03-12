import { sortPlanningYears } from '@/shared/utils/planningYears';

const API_BASE = '/api/planning';

export const planningYearService = {
  async getAvailableYears(): Promise<number[]> {
    const response = await fetch(`${API_BASE}/years`);
    if (!response.ok) {
      throw new Error(`Failed to fetch planning years: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }

    return sortPlanningYears(
      data
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    );
  },
};
