/**
 * Format a number as currency with symbol and comma separators
 * @param value - The numeric value to format
 * @param currencySymbol - The currency symbol to prepend (default: '$')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(value: number, currencySymbol = '$'): string {
  return `${currencySymbol}${value
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Parse a currency string to a number
 * Removes all non-numeric characters except decimal point and minus sign
 * @param value - The currency string to parse (e.g., "$1,234.56" or "1234.56")
 * @returns Parsed number or undefined if invalid
 */
export function parseCurrency(value: string): number | undefined {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}
