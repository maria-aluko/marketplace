import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchPageClient } from '@/components/search/search-page-client';

export const metadata: Metadata = {
  title: 'Find Vendors — EventTrust',
  description: 'Search for verified event vendors in Lagos. Caterers, photographers, venues, equipment rentals and more.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SearchPageClient />
    </Suspense>
  );
}
