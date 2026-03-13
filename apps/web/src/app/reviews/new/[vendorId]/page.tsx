import type { Metadata } from 'next';
import type { VendorResponse } from '@eventtrust/shared';
import { serverFetch } from '@/lib/server-api';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewForm } from '@/components/reviews/review-form';

interface Props {
  params: Promise<{ vendorId: string }>;
}

export const metadata: Metadata = {
  title: 'Write a Review — EventTrust',
};

export default async function NewReviewPage({ params }: Props) {
  const { vendorId } = await params;
  const vendor = await serverFetch<VendorResponse>(`/vendors/${vendorId}`);
  if (!vendor) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Review {vendor.businessName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm vendorId={vendorId} vendorName={vendor.businessName} vendorSlug={vendor.slug} />
        </CardContent>
      </Card>
    </div>
  );
}
