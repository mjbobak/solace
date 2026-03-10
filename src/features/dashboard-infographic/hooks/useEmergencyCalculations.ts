/**
 * Hook for calculating emergency runway (months of expenses covered by emergency fund)
 */

import { useEffect, useMemo, useState } from 'react';

import { mockBudgetData } from '@/features/budget/services/mockBudgetData';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import { calculateAnnualNet } from '@/features/income/types/income';
import type { IncomeEntry } from '@/features/income/types/income';

import {
  RUNWAY_THRESHOLDS,
  PERSON_IDENTIFIERS,
  RUNWAY_SCENARIO_LABELS,
} from '../constants/emergencyRunwayConfig';
import type {
  EmergencyRunwayData,
  RunwayColor,
} from '../types/emergencyRunway';

function getRunwayColor(months: number): RunwayColor {
  if (months > RUNWAY_THRESHOLDS.green) return 'green';
  if (months >= RUNWAY_THRESHOLDS.yellow) return 'yellow';
  return 'red';
}

export function useEmergencyCalculations(): EmergencyRunwayData {
  const [incomeData, setIncomeData] = useState<IncomeEntry[]>([]);

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getAllIncomes();
        setIncomeData(data);
      } catch (error) {
        console.error(
          'Failed to fetch income data for emergency calculations:',
          error,
        );
      }
    };

    fetchIncomeData();
  }, []);

  return useMemo(() => {
    // Calculate essential monthly spending (ESSENTIAL category only)
    const monthlyEssentials = mockBudgetData
      .filter((item) => item.expenseType === 'ESSENTIAL')
      .reduce((sum, item) => sum + item.budgeted, 0);

    // Calculate income by person
    let personAIncome = 0;
    let personBIncome = 0;

    incomeData.forEach((entry: IncomeEntry) => {
      // Calculate monthly income (always use net for living expense calculations)
      const annualNet = calculateAnnualNet(entry);
      const amount = annualNet / 12;

      const isPersonA = PERSON_IDENTIFIERS.personA.some((id) =>
        entry.stream.includes(id),
      );
      const isPersonB = PERSON_IDENTIFIERS.personB.some((id) =>
        entry.stream.includes(id),
      );

      if (isPersonA) {
        personAIncome += amount;
      } else if (isPersonB) {
        personBIncome += amount;
      }
    });

    // Emergency fund balance
    const emergencyFund = 18000; // Will be added to dashboardMetrics

    // Calculate months for each scenario
    // months = emergencyFund / (essentialSpending - remainingIncome)
    const calcMonths = (remainingIncome: number): number => {
      const burnRate = monthlyEssentials - remainingIncome;
      if (burnRate <= 0) return 999; // Infinite runway if income exceeds spending
      return emergencyFund / burnRate;
    };

    const personAMonths = calcMonths(personBIncome); // PersonA loses income, only PersonB remains
    const personBMonths = calcMonths(personAIncome); // PersonB loses income, only PersonA remains
    const bothMonths = calcMonths(0); // Both lose income

    return {
      scenarios: [
        {
          scenario: 'personA',
          label: RUNWAY_SCENARIO_LABELS.personA,
          monthlyIncome: personBIncome,
          essentialSpending: monthlyEssentials,
          emergencyFund,
          months: personAMonths,
          color: getRunwayColor(personAMonths),
        },
        {
          scenario: 'personB',
          label: RUNWAY_SCENARIO_LABELS.personB,
          monthlyIncome: personAIncome,
          essentialSpending: monthlyEssentials,
          emergencyFund,
          months: personBMonths,
          color: getRunwayColor(personBMonths),
        },
        {
          scenario: 'both',
          label: RUNWAY_SCENARIO_LABELS.both,
          monthlyIncome: 0,
          essentialSpending: monthlyEssentials,
          emergencyFund,
          months: bothMonths,
          color: getRunwayColor(bothMonths),
        },
      ],
      emergencyFundBalance: emergencyFund,
      monthlyEssentials,
    };
  }, [incomeData]);
}
