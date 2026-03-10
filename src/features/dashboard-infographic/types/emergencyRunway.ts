/**
 * Types for the Emergency Runway feature
 */

export type RunwayColor = 'green' | 'yellow' | 'red';
export type RunwayScenario = 'personA' | 'personB' | 'both';

export interface EmergencyRunwayScenario {
  scenario: RunwayScenario;
  label: string;
  monthlyIncome: number; // Income after loss
  essentialSpending: number; // Monthly essential expenses
  emergencyFund: number; // Current emergency fund balance
  months: number; // emergencyFund / (essentialSpending - monthlyIncome)
  color: RunwayColor;
}

export interface EmergencyRunwayData {
  scenarios: EmergencyRunwayScenario[];
  emergencyFundBalance: number;
  monthlyEssentials: number;
}
