'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InquiryResponse } from '@eventtrust/shared';
import Link from 'next/link';
import { formatDate, inquiryStatusVariant } from '@/lib/utils';

export function EnquiriesManager() {
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ data: InquiryResponse[] }>('/inquiries').then((res) => {
      if (res.success && res.data) {
        setInquiries(res.data.data);
      } else {
        setError(res.error ?? 'Failed to load enquiries');
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <p className="text-sm text-surface-500">Loading enquiries...</p>
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

  if (inquiries.length === 0) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 py-8 text-center">
        <p className="font-medium">No enquiries yet</p>
        <p className="text-sm text-surface-500">
          When you contact vendors on WhatsApp, your enquiries will appear here.
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
      <p className="text-sm text-surface-500">{inquiries.length} enquiry{inquiries.length !== 1 ? 's' : ''}</p>
      {inquiries.map((inquiry) => (
        <div
          key={inquiry.id}
          className="rounded-lg border border-surface-200 bg-white p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge variant={inquiryStatusVariant(inquiry.status)} className="text-xs">
              {inquiry.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-surface-400">{formatDate(inquiry.createdAt)}</span>
          </div>
          {inquiry.message && (
            <p className="text-sm text-surface-600 line-clamp-2">{inquiry.message}</p>
          )}
          {inquiry.invoiceId && (
            <Link href={`/invoices/${inquiry.invoiceId}`}>
              <Button variant="outline" size="sm" className="w-full mt-1">
                View Invoice
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
