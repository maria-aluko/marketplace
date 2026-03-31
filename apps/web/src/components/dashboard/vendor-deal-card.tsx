'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Copy, CheckCheck } from 'lucide-react';
import type { InquiryResponse, InvoiceResponse, InvoiceSummaryResponse } from '@eventtrust/shared';
import { InvoiceStatus } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';

export type VendorDealStage = 'new' | 'invoiced' | 'confirmed' | 'done' | 'cancelled';

export interface VendorDeal {
  inquiry: InquiryResponse;
  invoice?: InvoiceSummaryResponse;
  stage: VendorDealStage;
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function invoiceStatusChipClass(status: InvoiceStatus): string {
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

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.CONFIRMED:
      return '✓ Confirmed';
    case InvoiceStatus.COMPLETED:
      return '✓ Completed';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
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

export function VendorDealCard({
  deal,
  onCreateInvoice,
  onInvoiceSent,
  webUrl,
}: {
  deal: VendorDeal;
  onCreateInvoice: (inquiry: InquiryResponse) => void;
  onInvoiceSent?: (invoiceId: string) => void;
  webUrl: string;
}) {
  const { inquiry, invoice, stage } = deal;
  const isConfirmed = stage === 'confirmed' || stage === 'done';
  const isCancelled = stage === 'cancelled';
  const waPhone = inquiry.clientPhone?.replace('+', '');
  const [sending, setSending] = useState(false);

  const handleSendAndWhatsApp = async () => {
    if (!invoice) return;
    setSending(true);
    const res = await apiClient.post<{ data: InvoiceResponse }>(`/invoices/${invoice.id}/send`);
    setSending(false);
    if (!res.success) return;
    onInvoiceSent?.(invoice.id);
    const phone = inquiry.clientPhone?.replace('+', '');
    const msg = `Hi ${inquiry.clientName}! Your invoice is ready. Total: ${formatNaira(invoice.totalKobo)}. View and confirm: ${webUrl}/invoices/${invoice.id}`;
    window.open(`https://wa.me/${phone ?? ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

      {inquiry.listingTitle && <p className="text-sm">{inquiry.listingTitle}</p>}

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
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          {invoice ? (
            <>
              {invoice.status === InvoiceStatus.DRAFT && (
                <button
                  onClick={handleSendAndWhatsApp}
                  disabled={sending}
                  className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
                >
                  <MessageCircle className="h-3 w-3" />
                  {sending ? 'Sending...' : 'Send via WhatsApp'}
                </button>
              )}
              {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.VIEWED) && (
                <a
                  href={`https://wa.me/${inquiry.clientPhone?.replace('+', '') ?? ''}?text=${encodeURIComponent(
                    `Hi ${inquiry.clientName}! Your invoice is ready. Total: ${formatNaira(invoice.totalKobo)}. View: ${webUrl}/invoices/${invoice.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <MessageCircle className="h-3 w-3" />
                  Share on WhatsApp
                </a>
              )}
              <Link
                href={`/invoices/${invoice.id}?from=vendor`}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                View Invoice
              </Link>
              {invoice.status !== InvoiceStatus.DRAFT && (
                <CopyButton text={`${webUrl}/invoices/${invoice.id}`} />
              )}
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
