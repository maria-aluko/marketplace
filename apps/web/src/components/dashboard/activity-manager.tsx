'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { InquiryResponse, InvoiceSummaryResponse } from '@eventtrust/shared';
import { InquiryStatus, InvoiceStatus } from '@eventtrust/shared';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

type DealStage = 'enquired' | 'invoiced' | 'confirmed' | 'done' | 'cancelled';

interface DealThread {
  id: string;
  vendorId: string;
  vendorName?: string;
  listingTitle?: string;
  message?: string;
  inquiryStatus: InquiryStatus;
  inquiryCreatedAt: string;
  invoiceId?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceNumber?: string;
  invoiceTotalKobo?: number;
  invoiceEventDate?: string;
  invoiceCreatedAt?: string;
}

function getDealStage(thread: DealThread): DealStage {
  if (
    thread.inquiryStatus === InquiryStatus.CANCELLED ||
    thread.invoiceStatus === InvoiceStatus.CANCELLED
  )
    return 'cancelled';
  if (!thread.invoiceId) return 'enquired';
  if (
    thread.invoiceStatus === InvoiceStatus.COMPLETED ||
    thread.inquiryStatus === InquiryStatus.COMPLETED
  )
    return 'done';
  if (
    thread.invoiceStatus === InvoiceStatus.CONFIRMED ||
    thread.inquiryStatus === InquiryStatus.BOOKED
  )
    return 'confirmed';
  return 'invoiced';
}

const PIPELINE_STAGES: DealStage[] = ['enquired', 'invoiced', 'confirmed', 'done'];
const STAGE_INDEX: Record<DealStage, number> = {
  enquired: 0,
  invoiced: 1,
  confirmed: 2,
  done: 3,
  cancelled: -1,
};

function PipelineProgress({ stage }: { stage: DealStage }) {
  const activeIdx = STAGE_INDEX[stage] ?? -1;

  return (
    <div className="flex items-center">
      {PIPELINE_STAGES.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              i <= activeIdx ? 'bg-primary-600' : 'bg-surface-200'
            }`}
          />
          {i < PIPELINE_STAGES.length - 1 && (
            <div
              className={`h-px flex-1 ${i < activeIdx ? 'bg-primary-300' : 'bg-surface-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const STAGE_CHIP: Record<DealStage, string> = {
  enquired: 'bg-surface-100 text-surface-600',
  invoiced: 'bg-celebration-100 text-celebration-700',
  confirmed: 'bg-primary-100 text-primary-700',
  done: 'bg-primary-50 text-primary-600',
  cancelled: 'bg-surface-100 text-surface-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  });
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function ClientDealCard({ thread }: { thread: DealThread & { stage: DealStage } }) {
  const { stage } = thread;
  const isConfirmed = stage === 'confirmed';
  const isCancelled = stage === 'cancelled';

  const recencyDate =
    thread.invoiceCreatedAt &&
    new Date(thread.invoiceCreatedAt) > new Date(thread.inquiryCreatedAt)
      ? thread.invoiceCreatedAt
      : thread.inquiryCreatedAt;

  return (
    <div
      className={[
        'rounded-lg p-4 space-y-3',
        isConfirmed
          ? 'border border-primary-200 bg-primary-50'
          : 'border border-surface-200 bg-white',
        isCancelled ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_CHIP[stage]}`}
        >
          {(stage === 'confirmed' || stage === 'done') && '✓ '}
          {stage.charAt(0).toUpperCase() + stage.slice(1)}
        </span>
        <span className="text-xs text-surface-400">{formatDate(recencyDate)}</span>
      </div>

      {thread.vendorName && (
        <p className="font-semibold text-sm text-surface-900">{thread.vendorName}</p>
      )}
      {thread.listingTitle && (
        <p className="text-xs text-surface-500">re: {thread.listingTitle}</p>
      )}
      {thread.message && (
        <p className="text-sm text-surface-600 line-clamp-2">{thread.message}</p>
      )}

      <PipelineProgress stage={stage} />

      <div className="flex items-center justify-between">
        {thread.invoiceTotalKobo != null ? (
          <span className="font-semibold text-sm text-surface-800">
            {formatNaira(thread.invoiceTotalKobo)}
          </span>
        ) : (
          <span />
        )}

        {stage === 'invoiced' && thread.invoiceId && (
          <Link href={`/invoices/${thread.invoiceId}`}>
            <Button variant="outline" size="sm">
              View Invoice
            </Button>
          </Link>
        )}
        {stage === 'confirmed' && thread.invoiceId && (
          <Link href={`/invoices/${thread.invoiceId}`}>
            <Button size="sm">View Booking</Button>
          </Link>
        )}
        {stage === 'done' && thread.invoiceId && (
          <Link
            href={`/invoices/${thread.invoiceId}`}
            className="text-xs text-surface-500 hover:text-surface-700"
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-surface-200 rounded-lg p-4 space-y-3 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="h-5 w-20 bg-surface-200 rounded-full" />
            <div className="h-4 w-16 bg-surface-200 rounded" />
          </div>
          <div className="h-4 w-32 bg-surface-200 rounded" />
          <div className="h-2 bg-surface-200 rounded" />
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-surface-200 rounded" />
            <div className="h-7 w-24 bg-surface-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityManager() {
  const [threads, setThreads] = useState<(DealThread & { stage: DealStage })[]>([]);
  const [unlinkedInvoices, setUnlinkedInvoices] = useState<InvoiceSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: InquiryResponse[] }>('/inquiries'),
      apiClient.get<{ data: InvoiceSummaryResponse[] }>('/client/invoices'),
    ]).then(([inquiriesRes, invoicesRes]) => {
      if (!inquiriesRes.success || !invoicesRes.success) {
        setError(inquiriesRes.error ?? invoicesRes.error ?? 'Failed to load activity');
        setLoading(false);
        return;
      }

      const inquiries = inquiriesRes.data?.data ?? [];
      const invoices = invoicesRes.data?.data ?? [];

      const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));
      const linkedInvoiceIds = new Set<string>();

      const builtThreads: (DealThread & { stage: DealStage })[] = inquiries.map((inq) => {
        const invoice = inq.invoiceId ? invoiceMap.get(inq.invoiceId) : undefined;
        if (inq.invoiceId) linkedInvoiceIds.add(inq.invoiceId);

        const thread: DealThread = {
          id: inq.id,
          vendorId: inq.vendorId,
          vendorName: inq.vendorName ?? invoice?.vendorName,
          listingTitle: inq.listingTitle,
          message: inq.message,
          inquiryStatus: inq.status,
          inquiryCreatedAt: inq.createdAt,
          invoiceId: inq.invoiceId,
          invoiceStatus: invoice?.status,
          invoiceNumber: invoice?.invoiceNumber,
          invoiceTotalKobo: invoice?.totalKobo,
          invoiceEventDate: invoice?.eventDate,
          invoiceCreatedAt: invoice?.createdAt,
        };

        return { ...thread, stage: getDealStage(thread) };
      });

      builtThreads.sort((a, b) => {
        const aDate = Math.max(
          new Date(a.inquiryCreatedAt).getTime(),
          a.invoiceCreatedAt ? new Date(a.invoiceCreatedAt).getTime() : 0,
        );
        const bDate = Math.max(
          new Date(b.inquiryCreatedAt).getTime(),
          b.invoiceCreatedAt ? new Date(b.invoiceCreatedAt).getTime() : 0,
        );
        return bDate - aDate;
      });

      setThreads(builtThreads);
      setUnlinkedInvoices(invoices.filter((inv) => !linkedInvoiceIds.has(inv.id)));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (threads.length === 0 && unlinkedInvoices.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center py-8">
        <MessageSquare className="h-10 w-10 text-surface-300" />
        <p className="font-medium text-surface-700">No activity yet</p>
        <p className="text-sm text-surface-500">
          Contact vendors to see your enquiries and invoices here.
        </p>
        <Link href="/services">
          <Button variant="outline" size="sm">
            Find Vendors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4">
      {threads.map((thread) => (
        <ClientDealCard key={thread.id} thread={thread} />
      ))}

      {unlinkedInvoices.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-surface-500 mb-2">Other Invoices</p>
          {unlinkedInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-xl border border-surface-200 bg-white p-4 space-y-2 mb-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-surface-900">{invoice.vendorName ?? 'Vendor'}</p>
                  <p className="text-xs text-surface-500">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-primary-700">
                  {formatNaira(invoice.totalKobo)}
                </p>
                {invoice.eventDate && (
                  <p className="text-xs text-surface-500">Event: {formatDate(invoice.eventDate)}</p>
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
      )}
    </div>
  );
}
