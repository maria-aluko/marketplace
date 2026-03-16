'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvoiceGenerator } from './invoice-generator';
import type {
  InquiryResponse,
  InvoiceSummaryResponse,
  VendorFunnelResponse,
  InvoiceResponse,
} from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';
import Link from 'next/link';
import { MessageCircle, Copy, CheckCheck } from 'lucide-react';

interface BookingsManagerProps {
  vendorId: string;
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function invoiceStatusVariant(status: InvoiceStatus) {
  switch (status) {
    case InvoiceStatus.CONFIRMED:
    case InvoiceStatus.COMPLETED:
      return 'verified' as const;
    case InvoiceStatus.SENT:
    case InvoiceStatus.VIEWED:
      return 'secondary' as const;
    case InvoiceStatus.CANCELLED:
      return 'outline' as const;
    default:
      return 'default' as const;
  }
}

function FunnelStats({ funnel }: { funnel: VendorFunnelResponse }) {
  const stats = [
    { label: 'Leads', value: funnel.inquiriesThisMonth },
    { label: 'Invoiced', value: funnel.invoicesSentThisMonth },
    { label: 'Confirmed', value: funnel.confirmedBookingsThisMonth },
    { label: 'Completed', value: funnel.completedThisMonth },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-surface-200 bg-white p-3">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-xl font-bold text-primary-700">{stat.value}</p>
          <p className="text-[10px] text-surface-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
    >
      {copied ? (
        <>
          <CheckCheck className="h-3 w-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy link
        </>
      )}
    </button>
  );
}

export function BookingsManager({ vendorId }: BookingsManagerProps) {
  const [activeTab, setActiveTab] = useState<'leads' | 'invoices'>('invoices');
  const [funnel, setFunnel] = useState<VendorFunnelResponse | null>(null);
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://eventtrust.com.ng';

  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: VendorFunnelResponse }>(`/vendors/${vendorId}/invoices/funnel`),
      apiClient.get<{ data: InquiryResponse[] }>(`/vendors/${vendorId}/inquiries`),
      apiClient.get<{ data: InvoiceSummaryResponse[] }>(`/vendors/${vendorId}/invoices`),
    ]).then(([funnelRes, inquiriesRes, invoicesRes]) => {
      if (funnelRes.success && funnelRes.data) setFunnel(funnelRes.data.data);
      if (inquiriesRes.success && inquiriesRes.data) setInquiries(inquiriesRes.data.data);
      if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data.data);
      setLoading(false);
    });
  }, [vendorId]);

  const handleInvoiceCreated = (invoice: InvoiceResponse) => {
    setShowGenerator(false);
    // Refresh invoices list
    apiClient
      .get<{ data: InvoiceSummaryResponse[] }>(`/vendors/${vendorId}/invoices`)
      .then((res) => {
        if (res.success && res.data) setInvoices(res.data.data);
      });
  };

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="py-4">
        <InvoiceGenerator
          vendorId={vendorId}
          onCreated={handleInvoiceCreated}
          onCancel={() => setShowGenerator(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {funnel && <FunnelStats funnel={funnel} />}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-0.5">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'leads'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500'
            }`}
          >
            Leads ({inquiries.length})
          </button>
        </div>

        {activeTab === 'invoices' && (
          <Button size="sm" onClick={() => setShowGenerator(true)}>
            New Invoice
          </Button>
        )}
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-300 p-6 text-center">
              <p className="text-sm text-surface-500">No invoices yet</p>
              <p className="mt-1 text-xs text-surface-400">
                Create an invoice and share the link with your client via WhatsApp
              </p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-lg border border-surface-200 bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-surface-900">{invoice.clientName}</p>
                    <p className="text-xs text-surface-500">{invoice.invoiceNumber}</p>
                  </div>
                  <Badge variant={invoiceStatusVariant(invoice.status)} className="text-xs">
                    {invoice.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-surface-800">{formatNaira(invoice.totalKobo)}</span>
                  {invoice.eventDate && (
                    <span className="text-xs text-surface-500">{formatDate(invoice.eventDate)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    View
                  </Link>
                  <CopyButton text={`${webUrl}/invoices/${invoice.id}`} />
                  {invoice.status === 'DRAFT' && (
                    <button
                      onClick={async () => {
                        await apiClient.post(`/invoices/${invoice.id}/send`);
                        const res = await apiClient.get<{ data: InvoiceSummaryResponse[] }>(
                          `/vendors/${vendorId}/invoices`,
                        );
                        if (res.success && res.data) setInvoices(res.data.data);
                      }}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Mark as Sent
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-300 p-6 text-center">
              <p className="text-sm text-surface-500">No leads yet</p>
              <p className="mt-1 text-xs text-surface-400">
                Clients who contact you via WhatsApp will appear here
              </p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-lg border border-surface-200 bg-white p-4 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {inquiry.status}
                  </Badge>
                  <span className="text-xs text-surface-400">{formatDate(inquiry.createdAt)}</span>
                </div>
                {inquiry.message && (
                  <p className="text-sm text-surface-600 line-clamp-2">{inquiry.message}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-surface-400">
                  <MessageCircle className="h-3 w-3" />
                  <span>{inquiry.source.replace('_', ' ').toLowerCase()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
