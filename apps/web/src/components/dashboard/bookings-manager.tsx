'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceGenerator } from './invoice-generator';
import type {
  InquiryResponse,
  InvoiceSummaryResponse,
  VendorFunnelResponse,
  InvoiceResponse,
} from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';
import {
  VendorDealCard,
  type VendorDeal,
  type VendorDealStage,
} from './vendor-deal-card';

interface BookingsManagerProps {
  vendorId: string;
}

type FilterOption = 'all' | VendorDealStage;

function getDealStage(inquiry: InquiryResponse, invoice?: InvoiceSummaryResponse): VendorDealStage {
  if (inquiry.status === 'CANCELLED' || invoice?.status === InvoiceStatus.CANCELLED)
    return 'cancelled';
  if (!inquiry.invoiceId) return 'new';
  if (invoice?.status === InvoiceStatus.COMPLETED || inquiry.status === 'COMPLETED') return 'done';
  if (invoice?.status === InvoiceStatus.CONFIRMED || inquiry.status === 'BOOKED')
    return 'confirmed';
  return 'invoiced';
}

function FunnelStats({ funnel }: { funnel: VendorFunnelResponse }) {
  const stats = [
    { label: 'Leads', value: funnel.inquiriesThisMonth },
    { label: 'Invoiced', value: funnel.invoicesSentThisMonth },
    { label: 'Confirmed', value: funnel.confirmedBookingsThisMonth },
    { label: 'Done', value: funnel.completedThisMonth },
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

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  new: 'New Leads',
  invoiced: 'Invoiced',
  confirmed: 'Confirmed',
  done: 'Done',
  cancelled: 'Cancelled',
};
const ALL_FILTERS: FilterOption[] = ['all', 'new', 'invoiced', 'confirmed', 'done', 'cancelled'];

export function BookingsManager({ vendorId }: BookingsManagerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [funnel, setFunnel] = useState<VendorFunnelResponse | null>(null);
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryResponse | null>(null);

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
    }).catch(() => {
      setError('Failed to load bookings. Please try again.');
      setLoading(false);
    });
  }, [vendorId]);

  const handleInvoiceCreated = (_invoice: InvoiceResponse) => {
    setShowGenerator(false);
    setSelectedInquiry(null);
    Promise.all([
      apiClient.get<{ data: InvoiceSummaryResponse[] }>(`/vendors/${vendorId}/invoices`),
      apiClient.get<{ data: InquiryResponse[] }>(`/vendors/${vendorId}/inquiries`),
    ]).then(([invoicesRes, inquiriesRes]) => {
      if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data.data);
      if (inquiriesRes.success && inquiriesRes.data) setInquiries(inquiriesRes.data.data);
    }).catch(() => {});
  };

  const handleInvoiceSent = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: InvoiceStatus.SENT } : inv,
      ),
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="py-4">
        <InvoiceGenerator
          vendorId={vendorId}
          prefill={
            selectedInquiry
              ? {
                  clientName: selectedInquiry.clientName,
                  clientPhone: selectedInquiry.clientPhone,
                  inquiryId: selectedInquiry.id,
                  listingTitle: selectedInquiry.listingTitle,
                }
              : undefined
          }
          onCreated={handleInvoiceCreated}
          onCancel={() => {
            setShowGenerator(false);
            setSelectedInquiry(null);
          }}
        />
      </div>
    );
  }

  const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));
  const deals: VendorDeal[] = inquiries.map((inq) => ({
    inquiry: inq,
    invoice: inq.invoiceId ? invoiceMap.get(inq.invoiceId) : undefined,
    stage: getDealStage(inq, inq.invoiceId ? invoiceMap.get(inq.invoiceId) : undefined),
  }));

  // Sort: confirmed first, then by recency, cancelled at bottom
  deals.sort((a, b) => {
    if (a.stage === 'cancelled' && b.stage !== 'cancelled') return 1;
    if (b.stage === 'cancelled' && a.stage !== 'cancelled') return -1;
    if (a.stage === 'confirmed' && b.stage !== 'confirmed') return -1;
    if (b.stage === 'confirmed' && a.stage !== 'confirmed') return 1;
    return new Date(b.inquiry.createdAt).getTime() - new Date(a.inquiry.createdAt).getTime();
  });

  const stageCounts: Record<VendorDealStage, number> = {
    new: 0,
    invoiced: 0,
    confirmed: 0,
    done: 0,
    cancelled: 0,
  };
  for (const d of deals) stageCounts[d.stage]++;

  const filteredDeals =
    activeFilter === 'all' ? deals : deals.filter((d) => d.stage === activeFilter);

  const emptyMessages: Record<FilterOption, string> = {
    all: 'No leads yet',
    new: 'No new leads',
    invoiced: 'No invoiced leads',
    confirmed: 'No confirmed bookings yet',
    done: 'No completed bookings',
    cancelled: 'No cancelled deals',
  };

  return (
    <div className="space-y-4 py-4">
      {funnel && <FunnelStats funnel={funnel} />}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-surface-900">Bookings</h2>
        <Button size="sm" onClick={() => setShowGenerator(true)}>
          New Invoice
        </Button>
      </div>

      {/* Filter pills */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1 flex gap-2 flex-nowrap">
        {ALL_FILTERS.map((filter) => {
          const count = filter === 'all' ? deals.length : stageCounts[filter as VendorDealStage];
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={[
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-700',
              ].join(' ')}
            >
              {FILTER_LABELS[filter]}
              {count > 0 && <span className="ml-1 opacity-75">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredDeals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-300 p-6 text-center">
            <p className="text-sm text-surface-500">{emptyMessages[activeFilter]}</p>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <VendorDealCard
              key={deal.inquiry.id}
              deal={deal}
              onCreateInvoice={(inquiry) => {
                setSelectedInquiry(inquiry);
                setShowGenerator(true);
              }}
              onInvoiceSent={handleInvoiceSent}
              webUrl={webUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}
