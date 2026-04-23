import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString + "T00:00:00"));
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status === "paid") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "text-green-600 dark:text-green-400";
    case "overdue":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-yellow-600 dark:text-yellow-400";
  }
}
