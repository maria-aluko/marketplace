import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ListingSearchPageClient } from '@/components/search/listing-search-client';

export const metadata: Metadata = {
  title: 'Rent Event Equipment — EventTrust',
  description:
    'Browse equipment for rent in Lagos. Tents, chairs & tables, generators, lighting, cooking equipment and more.',
};

export default function EquipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <ListingSearchPageClient defaultListingType="rental" />
    </Suspense>
  );
}
