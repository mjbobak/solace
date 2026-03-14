/**
 * Public API exports for the dashboard-infographic feature
 */

// Main component
export { DashboardInfographic } from './components/DashboardInfographic';
export type { DashboardMode } from './components/DashboardInfographic';

// Hooks
export { useScrollAnimation } from './hooks/useScrollAnimation';
export { useScrollSpy } from './hooks/useScrollSpy';
export { useSpendingPulse } from './hooks/useSpendingPulse';
export { useEmergencyCalculations } from './hooks/useEmergencyCalculations';
export { useIncomeAnalysis } from './hooks/useIncomeAnalysis';
export { useDashboardKpiReport } from './hooks/useDashboardKpiReport';

// Types
export type { Period } from './types/infographic';
export type {
  SpendingPulseData,
  SpendingPulseTableData,
} from './types/spendingPulse';
export type {
  EmergencyRunwayData,
  EmergencyRunwayScenario,
} from './types/emergencyRunway';
export type { SectionId } from './constants/infographicConfig';
