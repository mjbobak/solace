import { useEffect, useState } from 'react';

import { planningYearService } from '@/shared/services/planningYearService';
import { MINIMUM_PLANNING_YEAR } from '@/shared/utils/planningYears';

interface UsePlanningYearsResult {
  years: number[];
  isLoading: boolean;
}

export function usePlanningYears(): UsePlanningYearsResult {
  const [years, setYears] = useState<number[]>([MINIMUM_PLANNING_YEAR]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadYears = async () => {
      try {
        const availableYears = await planningYearService.getAvailableYears();
        if (!isCancelled) {
          setYears(
            availableYears.length > 0
              ? availableYears
              : [MINIMUM_PLANNING_YEAR],
          );
        }
      } catch (error) {
        console.error('Failed to load planning years:', error);
        if (!isCancelled) {
          setYears([MINIMUM_PLANNING_YEAR]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadYears();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    years: years.length > 0 ? years : [MINIMUM_PLANNING_YEAR],
    isLoading,
  };
}
