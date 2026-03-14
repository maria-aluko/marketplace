import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price stored in kobo to a Naira display string.
 * e.g. 5000000 → "₦50,000"
 */
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

/**
 * Check if a URL looks like a valid image URL (http/https with image-like path).
 * Used to decide whether to render as <img> or show a placeholder.
 */
export function isImageUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url);
}
