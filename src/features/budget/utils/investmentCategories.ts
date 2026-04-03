interface InvestmentBudgetLike {
  expenseCategory?: string | null;
  isInvestment?: boolean;
}

function normalizeCategory(category: string | null | undefined): string {
  return category?.trim().toUpperCase() ?? '';
}

export function isInvestmentCategory(
  category: string | null | undefined,
): boolean {
  const normalized = normalizeCategory(category);
  return normalized.includes('INVEST');
}

export function isInvestmentBudgetEntry(
  entry: InvestmentBudgetLike | null | undefined,
): boolean {
  if (entry?.isInvestment != null) {
    return entry.isInvestment;
  }

  return isInvestmentCategory(entry?.expenseCategory);
}
