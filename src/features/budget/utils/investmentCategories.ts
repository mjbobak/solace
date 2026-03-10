export function isInvestmentCategory(category: string | null | undefined) {
  const normalized = category?.trim().toUpperCase() ?? '';
  return normalized.includes('INVEST');
}
