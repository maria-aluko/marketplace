import type { Metadata } from 'next';
import Link from 'next/link';
import type { ListingResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS } from '@eventtrust/shared';
import { serverFetch } from '@/lib/server-api';
import { formatNaira } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Browse Listings — EventTrust',
  description: 'Find trusted event vendors, services, and equipment rentals in Lagos.',
};

export default async function ListingsPage() {
  const result = await serverFetch<{ data: ListingResponse[] }>('/listings', {
    revalidate: 60,
    tags: ['listings'],
  });

  const listings = result?.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Browse Listings</h1>

      {listings.length === 0 ? (
        <p className="text-gray-500">No listings available yet. Check back soon!</p>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="block rounded-lg border p-4 transition hover:border-gray-400"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {listing.listingType}
                </span>
                {listing.category && (
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {CATEGORY_LABELS[listing.category] ?? listing.category}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{listing.title}</h2>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{listing.description}</p>
              {listing.priceFrom !== undefined && (
                <p className="mt-2 text-sm font-medium">
                  From {formatNaira(listing.priceFrom)}
                  {listing.priceTo !== undefined && ` — ${formatNaira(listing.priceTo)}`}
                </p>
              )}
              {listing.rentalDetails && (
                <p className="mt-1 text-xs text-gray-500">
                  {listing.rentalDetails.rentalCategory.replace(/_/g, ' ')} —{' '}
                  {listing.rentalDetails.quantityAvailable} available
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
