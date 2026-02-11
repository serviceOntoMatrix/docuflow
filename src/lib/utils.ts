import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sri Lanka timezone (Asia/Colombo - UTC+5:30)
export const SL_TIMEZONE = 'Asia/Colombo';

// Format date in Sri Lankan timezone
export function formatDateSL(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-LK', {
    timeZone: SL_TIMEZONE,
    ...options
  });
}

// Format date only (no time) in Sri Lankan timezone
export function formatDateOnlySL(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-LK', {
    timeZone: SL_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time only in Sri Lankan timezone
export function formatTimeSL(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-LK', {
    timeZone: SL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format full date and time in Sri Lankan timezone
export function formatDateTimeSL(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-LK', {
    timeZone: SL_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
