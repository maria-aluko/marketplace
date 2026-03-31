'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, CheckCircle2, Calendar, Clock, MapPin,
  MessageCircle, Copy, CheckCheck, Download,
} from 'lucide-react';
import type { InvoiceResponse } from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function nextStepText(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.SENT:
      return 'Confirm to secure your booking slot.';
    case InvoiceStatus.VIEWED:
      return "You're looking at it now. Confirm to lock it in.";
    case InvoiceStatus.CONFIRMED:
      return 'Booking secured. Prepare for your event.';
    case InvoiceStatus.COMPLETED:
      return 'All done! Share your experience with a review.';
    default:
      return '';
  }
}

function InvoiceStageTimeline({ invoice }: { invoice: InvoiceResponse }) {
  const stages: { label: string; timestamp?: string | null }[] = [
    { label: 'Sent', timestamp: invoice.sentAt },
    { label: 'Viewed', timestamp: invoice.viewedAt },
    { label: 'Confirmed', timestamp: invoice.confirmedAt },
    { label: 'Completed', timestamp: invoice.completedAt },
  ];

  const nextStep = nextStepText(invoice.status as InvoiceStatus);

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 space-y-3">
      {/* Vertical timeline (mobile-first) */}
      <div className="space-y-0">
        {stages.map((stage, i) => {
          const reached = !!stage.timestamp;
          const isLast = i === stages.length - 1;
          return (
            <div key={stage.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-3 h-3 rounded-full shrink-0 mt-0.5',
                    reached ? 'bg-primary-600' : 'bg-surface-200',
                  ].join(' ')}
                />
                {!isLast && (
                  <div className={`w-px flex-1 min-h-[20px] ${reached ? 'bg-primary-200' : 'bg-surface-200'}`} />
                )}
              </div>
              <div className="pb-3">
                <p className={`text-xs font-medium ${reached ? 'text-surface-800' : 'text-surface-400'}`}>
                  {stage.label}
                </p>
                {stage.timestamp && (
                  <p className="text-[10px] text-surface-400">{formatShortDate(stage.timestamp)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {nextStep && (
        <p className="text-xs text-primary-700 font-medium border-t border-surface-200 pt-2">
          {nextStep}
        </p>
      )}
    </div>
  );
}

interface InvoiceViewProps {
  invoice: InvoiceResponse;
  vendorName?: string;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function statusVariant(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.CONFIRMED:
    case InvoiceStatus.COMPLETED:
      return 'verified' as const;
    case InvoiceStatus.SENT:
    case InvoiceStatus.VIEWED:
      return 'secondary' as const;
    default:
      return 'default' as const;
  }
}

export function InvoiceView({ invoice: initialInvoice, vendorName }: InvoiceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(
    initialInvoice.status === InvoiceStatus.CONFIRMED ||
      initialInvoice.status === InvoiceStatus.COMPLETED,
  );
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isVendorOwner = !!user?.vendorId && user.vendorId === invoice.vendorId;
  const fromVendor = searchParams.get('from') === 'vendor';

  if (!isLoading && !isVendorOwner && invoice.status === InvoiceStatus.DRAFT) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <button
          onClick={() => fromVendor ? router.push('/dashboard?tab=bookings') : router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-lg border border-surface-200 bg-surface-50 p-8 text-center space-y-2">
          <p className="font-semibold text-surface-800">Invoice Not Available</p>
          <p className="text-sm text-surface-500">
            This invoice hasn&apos;t been sent yet. Contact your vendor for the latest quote.
          </p>
        </div>
      </div>
    );
  }

  const canConfirm =
    invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.VIEWED;

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    const res = await apiClient.post<{ data: InvoiceResponse }>(`/invoices/${invoice.id}/confirm?token=${invoice.confirmToken}`);
    setConfirming(false);

    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to confirm booking');
      return;
    }

    setInvoice(res.data.data);
    setConfirmed(true);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    const res = await apiClient.post<{ data: InvoiceResponse }>(`/invoices/${invoice.id}/send`);
    setSending(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to send invoice');
      return;
    }
    setInvoice(res.data.data);
    setShowWhatsApp(true);
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    const res = await apiClient.post<{ data: InvoiceResponse }>(`/invoices/${invoice.id}/complete`);
    setCompleting(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to mark as complete');
      return;
    }
    setInvoice(res.data.data);
  };

  const accentColor = invoice.branding?.accentColor ?? '#16a34a';

  const invoiceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invoices/${invoice.id}`
    : `/invoices/${invoice.id}`;

  const whatsAppMessage = `Hi ${invoice.clientName}! Your invoice from ${vendorName ?? 'your vendor'} is ready. Total: ${formatNaira(invoice.totalKobo)}. View and confirm your booking: ${invoiceUrl}`;

  const whatsAppHref = invoice.clientPhone
    ? `https://wa.me/${invoice.clientPhone.replace('+', '')}?text=${encodeURIComponent(whatsAppMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`;

  const showWhatsAppSection =
    showWhatsApp ||
    invoice.status === InvoiceStatus.SENT ||
    invoice.status === InvoiceStatus.VIEWED ||
    invoice.status === InvoiceStatus.CONFIRMED;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(invoiceUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button
        onClick={() => fromVendor ? router.push('/dashboard?tab=bookings') : router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        {invoice.branding?.logoUrl && (
          <img
            src={invoice.branding.logoUrl}
            alt="Vendor logo"
            className="mx-auto mb-3 h-12 object-contain"
          />
        )}
        <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
          EventTrust Nigeria
        </p>
        <h1 className="mt-1 text-2xl font-bold text-surface-900">Invoice</h1>
        <p className="text-sm text-surface-500">{invoice.invoiceNumber}</p>
        {invoice.branding?.tagline && (
          <p className="mt-1 text-sm italic text-surface-500">{invoice.branding.tagline}</p>
        )}
        <div className="mt-2">
          <Badge variant={statusVariant(invoice.status as InvoiceStatus)}>
            {invoice.status}
          </Badge>
        </div>
      </div>

      {/* Stage Timeline */}
      {invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CANCELLED && (
        <div className="mb-4">
          <InvoiceStageTimeline invoice={invoice} />
        </div>
      )}

      {/* Vendor + Client */}
      <div className="rounded-lg border border-surface-200 bg-white p-4 space-y-3 text-sm">
        {vendorName && (
          <div>
            <p className="text-xs text-surface-400 uppercase tracking-wide">From</p>
            <p className="font-medium text-surface-900">{vendorName}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-surface-400 uppercase tracking-wide">To</p>
          <p className="font-medium text-surface-900">{invoice.clientName}</p>
          {invoice.clientPhone && <p className="text-surface-500">{invoice.clientPhone}</p>}
          {invoice.clientEmail && <p className="text-surface-500">{invoice.clientEmail}</p>}
        </div>

        {(invoice.eventDate || invoice.eventLocation) && (
          <div className="border-t border-surface-100 pt-3 space-y-1">
            {invoice.eventDate && (
              <div className="flex items-center gap-2 text-surface-600">
                <Calendar className="h-4 w-4 flex-shrink-0 text-surface-400" />
                <span>{formatDate(invoice.eventDate)}</span>
              </div>
            )}
            {invoice.dueDate && (
              <div className="flex items-center gap-2 text-surface-600">
                <Clock className="h-4 w-4 flex-shrink-0 text-surface-400" />
                <span>Due: {formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.eventLocation && (
              <div className="flex items-center gap-2 text-surface-600">
                <MapPin className="h-4 w-4 flex-shrink-0 text-surface-400" />
                <span>{invoice.eventLocation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="mt-4 rounded-lg border border-surface-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-surface-500">Item</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-surface-500">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-surface-500">Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-surface-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-surface-700">{item.description}</td>
                <td className="px-4 py-3 text-right text-surface-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-surface-600">
                  {formatNaira(item.unitPriceKobo)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-surface-800">
                  {formatNaira(item.totalKobo)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface-50">
            {invoice.discountKobo > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-sm text-surface-500">
                  Discount
                </td>
                <td className="px-4 py-2 text-right text-sm text-green-600">
                  -{formatNaira(invoice.discountKobo)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-surface-900">
                Total
              </td>
              <td className="px-4 py-3 text-right font-bold text-surface-900">
                {formatNaira(invoice.totalKobo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-4 rounded-lg border border-surface-200 bg-white p-4">
          <p className="text-xs text-surface-400 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-surface-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-6 print:hidden">
        {confirmed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Booking Confirmed!</p>
            </div>
            <Link href={`/reviews/new/${invoice.vendorId}?invoiceId=${invoice.id}`}>
              <Button variant="outline" className="w-full">Write a Review</Button>
            </Link>
          </div>
        ) : canConfirm ? (
          <div className="space-y-2">
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button
              className="w-full"
              style={{ backgroundColor: accentColor }}
              size="lg"
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Confirming...' : 'Confirm Booking'}
            </Button>
            <p className="text-xs text-center text-surface-400">
              Tap to confirm you accept this quote
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-surface-400">
            Invoice status: {invoice.status.toLowerCase()}
          </p>
        )}
      </div>

      {/* Vendor Actions */}
      {isVendorOwner && (
        <div className="mt-6 space-y-3 print:hidden">
          <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Vendor Actions</p>

          {invoice.status === InvoiceStatus.DRAFT && (
            <div className="space-y-2">
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button className="w-full" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : 'Send Invoice'}
              </Button>
              <p className="text-xs text-center text-surface-400">
                Sends this invoice to the client and marks it as Sent
              </p>
            </div>
          )}

          {invoice.status === InvoiceStatus.CONFIRMED && (
            <div className="space-y-2">
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button className="w-full" variant="outline" onClick={handleComplete} disabled={completing}>
                {completing ? 'Completing...' : 'Mark as Complete'}
              </Button>
              <p className="text-xs text-center text-surface-400">
                Mark this booking as delivered and done
              </p>
            </div>
          )}

          {showWhatsAppSection && (
            <div className="flex items-center gap-3">
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700"
              >
                {linkCopied ? (
                  <><CheckCheck className="h-4 w-4" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy Link</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {invoice.branding?.footerText && (
        <p className="mt-6 text-center text-xs text-surface-400">{invoice.branding.footerText}</p>
      )}
    </div>
  );
}
