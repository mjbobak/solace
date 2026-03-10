export function getStringParam(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key);
  return value && value.length > 0 ? value : undefined;
}

export function getNumberParam(
  searchParams: URLSearchParams,
  key: string,
): number | undefined {
  const value = searchParams.get(key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const value = searchParams.get(key);
  return value && allowedValues.includes(value as T) ? (value as T) : fallback;
}

export function getMultiValueParam(
  searchParams: URLSearchParams,
  key: string,
): string[] {
  return Array.from(
    new Set(searchParams.getAll(key).filter((value) => value.length > 0)),
  );
}

export function setStringParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  if (!value || value.trim().length === 0) {
    searchParams.delete(key);
    return;
  }

  searchParams.set(key, value);
}

export function setNumberParam(
  searchParams: URLSearchParams,
  key: string,
  value: number | undefined,
): void {
  if (value === undefined || Number.isNaN(value)) {
    searchParams.delete(key);
    return;
  }

  searchParams.set(key, String(value));
}

export function setMultiValueParam(
  searchParams: URLSearchParams,
  key: string,
  values: string[],
): void {
  searchParams.delete(key);
  values
    .filter((value) => value.length > 0)
    .forEach((value) => searchParams.append(key, value));
}
