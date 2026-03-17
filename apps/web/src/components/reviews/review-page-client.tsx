'use client';

import { useEffect, useState } from 'react';
import type { InvoiceResponse, InvoiceSummaryResponse } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { ReviewForm } from './review-form';
import { ReviewInvoicePicker } from './review-invoice-picker';

interface ReviewPageClientProps {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  invoiceId?: string;
}

export function ReviewPageClient({ vendorId, vendorName, vendorSlug, invoiceId }: ReviewPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [eligibleInvoices, setEligibleInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (invoiceId) {
        const res = await apiClient.get<{ data: InvoiceResponse }>(`/client/invoices/${invoiceId}`);
        if (res.success && res.data) {
          const inv = (res.data as any).data ?? res.data;
          if (inv.status === 'CONFIRMED' || inv.status === 'COMPLETED') {
            setInvoice(inv);
          } else {
            setError('This invoice is not eligible for a review.');
          }
        } else {
          setError('Invoice not found or you do not have access.');
        }
      } else {
        const res = await apiClient.get<{ data: InvoiceSummaryResponse[] }>(
          `/client/invoices?vendorId=${vendorId}&status=CONFIRMED,COMPLETED`,
        );
        if (res.success && res.data) {
          const items = (res.data as any).data ?? res.data;
          setEligibleInvoices(Array.isArray(items) ? items : []);
        }
      }

      setLoading(false);
    }

    load();
  }, [invoiceId, vendorId]);

  if (loading) {
    return (
      <div className="py-8 space-y-3">
        <div className="h-4 bg-surface-100 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-surface-100 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (invoice) {
    return (
      <ReviewForm
        vendorId={vendorId}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
      />
    );
  }

  if (eligibleInvoices.length === 0) {
    return (
      <p className="text-sm text-surface-500">
        You can only review vendors you have a confirmed or completed booking with.
      </p>
    );
  }

  return (
    <ReviewInvoicePicker
      invoices={eligibleInvoices}
      vendorId={vendorId}
      vendorName={vendorName}
      vendorSlug={vendorSlug}
    />
  );
}
