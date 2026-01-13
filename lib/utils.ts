import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Get severity color for badges
 */
export function getSeverityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'LOW':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'MEDIUM':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'OPEN':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'ACKNOWLEDGED':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'IN_PROGRESS':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'RESOLVED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'CLOSED':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'CONFIRMED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'CANCELLED':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
