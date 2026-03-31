'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { InvoiceSummaryResponse } from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';
import { formatNaira, formatDate, invoiceStatusVariant } from '@/lib/utils';

export function ReceivedInvoicesManager() {
  const [invoices, setInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data: InvoiceSummaryResponse[] }>('/client/invoices')
      .then((res) => {
        if (res.success && res.data) {
          setInvoices(res.data.data);
        } else {
          setError(res.error ?? 'Failed to load invoices');
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-surface-500">Loading invoices…</div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-sm text-red-500">{error}</div>;
  }

  if (invoices.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <FileText className="h-10 w-10 text-surface-300" />
        <p className="font-medium text-surface-700">No invoices yet</p>
        <p className="text-sm text-surface-500">
          When a vendor sends you an invoice, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4">
      <h2 className="text-base font-semibold">Received Invoices</h2>
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="rounded-xl border border-surface-200 bg-white p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-surface-900">
                {invoice.vendorName ?? 'Vendor'}
              </p>
              <p className="text-xs text-surface-500">{invoice.invoiceNumber}</p>
            </div>
            <Badge variant={invoiceStatusVariant(invoice.status as InvoiceStatus)}>
              {invoice.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary-700">
              {formatNaira(invoice.totalKobo)}
            </p>
            {invoice.eventDate && (
              <p className="text-xs text-surface-500">
                Event: {formatDate(invoice.eventDate)}
              </p>
            )}
          </div>

          <Link
            href={`/invoices/${invoice.id}`}
            className="block w-full rounded-lg border border-primary-200 py-2 text-center text-sm font-medium text-primary-700 active:bg-primary-50"
          >
            View Invoice
          </Link>
        </div>
      ))}
    </div>
  );
}
