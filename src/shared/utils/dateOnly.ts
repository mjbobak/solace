export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  return new Date(year, month - 1, day);
}

export function toDateOnlyString(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTodayDateOnly(): string {
  return toDateOnlyString(new Date());
}

export function formatDateOnly(
  value: string,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locales, options).format(parseDateOnly(value));
}

export function getMonthIndexFromDateOnly(value: string): number {
  return parseDateOnly(value).getMonth();
}

export function getYearFromDateOnly(value: string): number {
  return parseDateOnly(value).getFullYear();
}
