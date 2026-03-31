import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InvoiceStatus, InquiryStatus } from '@eventtrust/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/** Format a kobo amount to a Naira display string. e.g. 5000000 → "₦50,000" */
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

/** Like formatNaira but returns '' when kobo is falsy — for optional price fields. */
export function formatPrice(kobo?: number): string {
  if (!kobo) return '';
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** "Mar 5, 2026" — standard medium date used across most of the app */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** "Mar 5" — compact date for space-constrained UI (pipeline cards, timelines) */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  });
}

/** "Wednesday, March 5, 2026" — long date for invoice print/view headers */
export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

/** "pickup_only" → "Pickup Only" */
export function formatDeliveryOption(option: string): string {
  return option.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Invoice status helpers
// ---------------------------------------------------------------------------

export function invoiceStatusChipClass(status: InvoiceStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-surface-100 text-surface-500';
    case 'SENT':
      return 'bg-celebration-100 text-celebration-700';
    case 'VIEWED':
      return 'bg-celebration-200 text-celebration-800';
    case 'CONFIRMED':
      return 'bg-primary-100 text-primary-700 font-semibold';
    case 'COMPLETED':
      return 'bg-primary-50 text-primary-600';
    case 'CANCELLED':
      return 'bg-surface-100 text-surface-400 line-through';
    default:
      return 'bg-surface-100 text-surface-500';
  }
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return '✓ Confirmed';
    case 'COMPLETED':
      return '✓ Completed';
    default:
      return (status as string).charAt(0) + (status as string).slice(1).toLowerCase();
  }
}

export function invoiceStatusVariant(
  status: InvoiceStatus,
): 'default' | 'secondary' | 'verified' | 'outline' {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'verified';
    case 'SENT':
    case 'VIEWED':
      return 'secondary';
    case 'CANCELLED':
      return 'outline';
    default:
      return 'default';
  }
}

/** Next-step guidance text shown below the invoice stage timeline */
export function invoiceNextStepText(status: InvoiceStatus): string {
  switch (status) {
    case 'SENT':
      return 'Confirm to secure your booking slot.';
    case 'VIEWED':
      return "You're looking at it now. Confirm to lock it in.";
    case 'CONFIRMED':
      return 'Booking secured. Prepare for your event.';
    case 'COMPLETED':
      return 'All done! Share your experience with a review.';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Inquiry status helpers
// ---------------------------------------------------------------------------

export function inquiryStatusVariant(
  status: InquiryStatus,
): 'default' | 'secondary' | 'verified' | 'outline' {
  switch (status) {
    case 'BOOKED':
    case 'COMPLETED':
      return 'verified';
    case 'NEW':
    case 'CONTACTED':
      return 'secondary';
    case 'CANCELLED':
      return 'outline';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/**
 * Check if a URL looks like a valid image URL (http/https with image-like path).
 * Used to decide whether to render as <img> or show a placeholder.
 */
export function isImageUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
