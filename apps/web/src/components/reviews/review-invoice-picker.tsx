'use client';

import { useState } from 'react';
import type { InvoiceSummaryResponse } from '@eventtrust/shared';
import { ReviewForm } from './review-form';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface ReviewInvoicePickerProps {
  invoices: InvoiceSummaryResponse[];
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

export function ReviewInvoicePicker({
  invoices,
  vendorId,
  vendorName,
  vendorSlug,
}: ReviewInvoicePickerProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  if (selectedInvoice) {
    return (
      <ReviewForm
        vendorId={vendorId}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
        invoiceId={selectedInvoice.id}
        invoiceNumber={selectedInvoice.invoiceNumber}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-surface-600">Select the booking you are reviewing:</p>
      {invoices.map((invoice) => (
        <Button
          key={invoice.id}
          type="button"
          onClick={() => setSelectedInvoiceId(invoice.id)}
          className="w-full rounded-lg border border-surface-200 p-3 text-left hover:border-primary-500 hover:bg-surface-50 transition-colors"
        >
          <p className="text-sm font-medium text-surface-900">#{invoice.invoiceNumber}</p>
          {invoice.eventDate && (
            <p className="mt-0.5 text-xs text-surface-500">
              Event: {formatDate(invoice.eventDate)}
            </p>
          )}
          <p className="mt-0.5 text-xs text-surface-400 capitalize">
            {invoice.status.toLowerCase()}
          </p>
        </Button>
      ))}
    </div>
  );
}
