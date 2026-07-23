import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the most recent Friday from a given date
 */
export function getMostRecentFriday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // If today is Friday (5), use today. Otherwise, go back to the most recent Friday.
  const diff = day >= 5 ? day - 5 : day + 2;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

/**
 * Calculate weeks between two dates
 */
export function weeksBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60 * 24 * 7)) * 10) / 10;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: "EUR" | "USD" = "EUR"): string {
  return new Intl.NumberFormat(currency === "EUR" ? "es-ES" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Check if a report is still editable (within 48 hours)
 */
export function isReportEditable(submittedAt: string): boolean {
  const submitted = new Date(submittedAt);
  const now = new Date();
  const diffHours = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
  return diffHours <= 48;
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
