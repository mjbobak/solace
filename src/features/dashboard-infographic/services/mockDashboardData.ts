export interface SpendingData {
  month: string;
  Budget: number;
  Actual: number;
  [key: string]: string | number;
}

export interface SavingsData {
  month: string;
  savings: number;
  [key: string]: string | number;
}

export interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardMetrics {
  totalBalance: number;
  monthlySpending: number;
  monthlySavings: number;
  savingsRate: number;
  emergencyFundBalance?: number;
}

export const spendingData: SpendingData[] = [
  { month: 'Jan', Budget: 5000, Actual: 4200 },
  { month: 'Feb', Budget: 5000, Actual: 4800 },
  { month: 'Mar', Budget: 5000, Actual: 4500 },
  { month: 'Apr', Budget: 5200, Actual: 5100 },
  { month: 'May', Budget: 5200, Actual: 4900 },
  { month: 'Jun', Budget: 5200, Actual: 5300 },
  { month: 'Jul', Budget: 5500, Actual: 5200 },
  { month: 'Aug', Budget: 5500, Actual: 5400 },
  { month: 'Sep', Budget: 5500, Actual: 5100 },
  { month: 'Oct', Budget: 5800, Actual: 5600 },
  { month: 'Nov', Budget: 5800, Actual: 5700 },
  { month: 'Dec', Budget: 6000, Actual: 5900 },
];

export const savingsData: SavingsData[] = [
  { month: 'Jan', savings: 800 },
  { month: 'Feb', savings: 1200 },
  { month: 'Mar', savings: 1500 },
  { month: 'Apr', savings: 1100 },
  { month: 'May', savings: 1300 },
  { month: 'Jun', savings: 900 },
  { month: 'Jul', savings: 1300 },
  { month: 'Aug', savings: 1100 },
  { month: 'Sep', savings: 1400 },
  { month: 'Oct', savings: 1200 },
  { month: 'Nov', savings: 1100 },
  { month: 'Dec', savings: 1000 },
];

export const categoryData: CategoryData[] = [
  { name: 'Groceries', value: 1200 },
  { name: 'Utilities', value: 400 },
  { name: 'Entertainment', value: 300 },
  { name: 'Transportation', value: 600 },
  { name: 'Healthcare', value: 250 },
  { name: 'Shopping', value: 450 },
  { name: 'Dining Out', value: 500 },
  { name: 'Other', value: 500 },
];

export const dashboardMetrics: DashboardMetrics = {
  totalBalance: 25420,
  monthlySpending: 4650,
  monthlySavings: 1150,
  savingsRate: 19.8,
  emergencyFundBalance: 18000,
};
