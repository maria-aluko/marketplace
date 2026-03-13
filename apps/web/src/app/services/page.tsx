import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListingSearchPageClient } from '@/components/search/listing-search-client';

export const metadata: Metadata = {
  title: 'Find Event Services — EventTrust',
  description:
    'Search for verified event services in Lagos. Catering, photography, venues, decoration, DJs and more.',
};

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-surface-500">Loading...</p>
        </div>
      }
    >
      <ListingSearchPageClient defaultListingType="service" />
    </Suspense>
  );
}
