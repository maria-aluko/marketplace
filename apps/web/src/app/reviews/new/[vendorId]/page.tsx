import type { Metadata } from 'next';
import type { VendorResponse } from '@eventtrust/shared';
import { serverFetch } from '@/lib/server-api';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewPageClient } from '@/components/reviews/review-page-client';

interface Props {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ invoiceId?: string }>;
}

export const metadata: Metadata = {
  title: 'Write a Review — EventTrust',
};

export default async function NewReviewPage({ params, searchParams }: Props) {
  const { vendorId } = await params;
  const { invoiceId } = await searchParams;

  const vendor = await serverFetch<VendorResponse>(`/vendors/${vendorId}`);
  if (!vendor) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review {vendor.businessName}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewPageClient
            vendorId={vendorId}
            vendorName={vendor.businessName}
            vendorSlug={vendor.slug}
            invoiceId={invoiceId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
