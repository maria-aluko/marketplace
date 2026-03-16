'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, MapPin } from 'lucide-react';
import type { InvoiceResponse } from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';

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
  const [invoice, setInvoice] = useState(initialInvoice);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(
    initialInvoice.status === InvoiceStatus.CONFIRMED ||
      initialInvoice.status === InvoiceStatus.COMPLETED,
  );
  const [error, setError] = useState<string | null>(null);

  const canConfirm =
    invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.VIEWED;

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    const res = await apiClient.post<{ data: InvoiceResponse }>(`/invoices/${invoice.id}/confirm`);
    setConfirming(false);

    if (!res.success || !res.data) {
      setError(res.error ?? 'Failed to confirm booking');
      return;
    }

    setInvoice(res.data.data);
    setConfirmed(true);
  };

  const accentColor = invoice.branding?.accentColor ?? '#16a34a';

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
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
      <div className="mt-6">
        {confirmed ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Booking Confirmed!</p>
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

      {/* Footer */}
      {invoice.branding?.footerText && (
        <p className="mt-6 text-center text-xs text-surface-400">{invoice.branding.footerText}</p>
      )}
    </div>
  );
}
