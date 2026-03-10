import type { SpendingEntry } from '../types/spendingView';

const ACCOUNTS = [
  'Discover',
  'Chase Checking',
  'Wells Fargo',
  'Capital One',
  'Bank of America',
];
const CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Shopping',
  'Transportation',
  'Healthcare',
  'Utilities',
  'Entertainment',
  'Home & Garden',
];
const MERCHANTS = [
  'Whole Foods Market',
  'Target',
  'Amazon',
  'Starbucks',
  'Shell Gas Station',
  'CVS Pharmacy',
  'Local Restaurant',
  'Uber',
  'Home Depot',
  'Netflix',
  'Apple Store',
  "Trader Joe's",
  'Best Buy',
  'Walgreens',
  'United Airlines',
];

function generateMockData(): SpendingEntry[] {
  const data: SpendingEntry[] = [];
  let id = 1;

  // Generate data across 2 years (2023 and 2024) and 2025
  for (let year = 2023; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      // 8-12 transactions per month
      const transactionsPerMonth = Math.floor(Math.random() * 5) + 8;

      for (let i = 0; i < transactionsPerMonth; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const transactionDate = new Date(year, month - 1, day);
        const postDate = new Date(transactionDate);
        postDate.setDate(
          postDate.getDate() + Math.floor(Math.random() * 3) + 1,
        ); // Post 1-3 days later

        const amount = Math.random() * 500 + 10; // $10-$510
        const isLargeTransaction = amount > 300;
        const isAccrual = isLargeTransaction
          ? Math.random() > 0.7
          : Math.random() > 0.9;

        const account = ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];
        const category =
          CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const merchant =
          MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];

        data.push({
          id: `TXN-${String(id).padStart(4, '0')}`,
          account,
          transactionDate: transactionDate.toISOString().split('T')[0],
          postDate: postDate.toISOString().split('T')[0],
          description: merchant,
          category,
          amount: Math.round(amount * 100) / 100,
          isAccrual,
        });

        id++;
      }
    }
  }

  return data.sort(
    (a, b) =>
      new Date(b.transactionDate).getTime() -
      new Date(a.transactionDate).getTime(),
  );
}

export const mockSpendingData = generateMockData();
