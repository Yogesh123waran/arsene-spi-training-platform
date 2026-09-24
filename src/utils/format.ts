/** Small, dependency-free formatting helpers shared across features. */

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatPercentage(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
