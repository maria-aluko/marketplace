'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
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

type VendorDealStage = 'new' | 'invoiced' | 'confirmed' | 'done' | 'cancelled';
type FilterOption = 'all' | VendorDealStage;

interface VendorDeal {
  inquiry: InquiryResponse;
  invoice?: InvoiceSummaryResponse;
  stage: VendorDealStage;
}

function getDealStage(
  inquiry: InquiryResponse,
  invoice?: InvoiceSummaryResponse,
): VendorDealStage {
  if (inquiry.status === 'CANCELLED' || invoice?.status === InvoiceStatus.CANCELLED)
    return 'cancelled';
  if (!inquiry.invoiceId) return 'new';
  if (invoice?.status === InvoiceStatus.COMPLETED || inquiry.status === 'COMPLETED') return 'done';
  if (invoice?.status === InvoiceStatus.CONFIRMED || inquiry.status === 'BOOKED') return 'confirmed';
  return 'invoiced';
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

function invoiceStatusChipClass(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.DRAFT:
      return 'bg-surface-100 text-surface-500';
    case InvoiceStatus.SENT:
      return 'bg-celebration-100 text-celebration-700';
    case InvoiceStatus.VIEWED:
      return 'bg-celebration-200 text-celebration-800';
    case InvoiceStatus.CONFIRMED:
      return 'bg-primary-100 text-primary-700 font-semibold';
    case InvoiceStatus.COMPLETED:
      return 'bg-primary-50 text-primary-600';
    case InvoiceStatus.CANCELLED:
      return 'bg-surface-100 text-surface-400 line-through';
    default:
      return 'bg-surface-100 text-surface-500';
  }
}

function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.CONFIRMED:
      return '✓ Confirmed';
    case InvoiceStatus.COMPLETED:
      return '✓ Completed';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
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

function CopyPhone({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-surface-400 hover:text-surface-600"
    >
      {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function VendorDealCard({
  deal,
  onCreateInvoice,
  webUrl,
}: {
  deal: VendorDeal;
  onCreateInvoice: (inquiry: InquiryResponse) => void;
  webUrl: string;
}) {
  const { inquiry, invoice, stage } = deal;
  const isConfirmed = stage === 'confirmed' || stage === 'done';
  const isCancelled = stage === 'cancelled';
  const waPhone = inquiry.clientPhone?.replace('+', '');

  const STAGE_CHIP: Record<VendorDealStage, string> = {
    new: 'bg-surface-100 text-surface-600',
    invoiced: 'bg-celebration-100 text-celebration-700',
    confirmed: 'bg-primary-100 text-primary-700',
    done: 'bg-primary-50 text-primary-600',
    cancelled: 'bg-surface-100 text-surface-400',
  };

  const stageLabel: Record<VendorDealStage, string> = {
    new: 'New Lead',
    invoiced: 'Invoiced',
    confirmed: '✓ Confirmed',
    done: '✓ Done',
    cancelled: 'Cancelled',
  };

  return (
    <div
      className={[
        'rounded-lg p-4 space-y-2',
        isConfirmed
          ? 'border border-primary-200 bg-primary-50'
          : 'border border-surface-200 bg-white',
        isCancelled ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CHIP[stage]}`}
        >
          {stageLabel[stage]}
        </span>
        <span className="text-xs text-surface-400">{formatDate(inquiry.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {inquiry.clientName && (
          <p className="text-sm font-semibold text-surface-900">{inquiry.clientName}</p>
        )}
        {waPhone && (
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 shrink-0"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
        )}
      </div>

      {inquiry.clientPhone && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-700">{inquiry.clientPhone}</span>
          <CopyPhone text={inquiry.clientPhone} />
        </div>
      )}

      {inquiry.listingTitle && (
        <p className="text-xs text-surface-500">re: {inquiry.listingTitle}</p>
      )}

      {inquiry.message && (
        <p className="text-sm text-surface-600 line-clamp-2">{inquiry.message}</p>
      )}

      {invoice && (
        <div className="border-t border-surface-100 pt-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-surface-500">{invoice.invoiceNumber}</span>
              <span className="mx-2 text-surface-300">·</span>
              <span className="text-sm font-semibold text-surface-800">
                {formatNaira(invoice.totalKobo)}
              </span>
            </div>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${invoiceStatusChipClass(invoice.status as InvoiceStatus)}`}
            >
              {invoiceStatusLabel(invoice.status as InvoiceStatus)}
            </span>
          </div>
          {invoice.eventDate && (
            <p className="text-xs text-surface-500">Event: {formatDate(invoice.eventDate)}</p>
          )}
        </div>
      )}

      {!isCancelled && (
        <div className="flex items-center gap-3 pt-1">
          {invoice ? (
            <>
              <Link
                href={`/invoices/${invoice.id}`}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                View Invoice
              </Link>
              <CopyButton text={`${webUrl}/invoices/${invoice.id}`} />
            </>
          ) : (
            <button
              onClick={() => onCreateInvoice(inquiry)}
              className="text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              Create Invoice
            </button>
          )}
        </div>
      )}
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
    });
  }, [vendorId]);

  const handleInvoiceCreated = (invoice: InvoiceResponse) => {
    void invoice;
    setShowGenerator(false);
    setSelectedInquiry(null);
    Promise.all([
      apiClient.get<{ data: InvoiceSummaryResponse[] }>(`/vendors/${vendorId}/invoices`),
      apiClient.get<{ data: InquiryResponse[] }>(`/vendors/${vendorId}/inquiries`),
    ]).then(([invoicesRes, inquiriesRes]) => {
      if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data.data);
      if (inquiriesRes.success && inquiriesRes.data) setInquiries(inquiriesRes.data.data);
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
              {count > 0 && (
                <span className="ml-1 opacity-75">{count}</span>
              )}
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
              webUrl={webUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}
