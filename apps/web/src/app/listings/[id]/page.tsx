import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ListingResponse } from '@eventtrust/shared';
import { serverFetch } from '@/lib/server-api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await serverFetch<ListingResponse>(`/listings/${id}`);
  if (!listing) return { title: 'Listing Not Found' };

  return {
    title: `${listing.title} — EventTrust`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await serverFetch<ListingResponse>(`/listings/${id}`);
  if (!listing) notFound();

  const whatsappText = encodeURIComponent(
    `Hi, I'm interested in your listing "${listing.title}" on EventTrust.`,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {listing.listingType}
        </span>
        {listing.category && (
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {listing.category.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <h1 className="mb-4 text-2xl font-bold">{listing.title}</h1>

      <p className="mb-6 whitespace-pre-line text-gray-700">{listing.description}</p>

      {listing.priceFrom !== undefined && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Price range: </span>
          <span className="font-semibold">
            {listing.priceFrom.toLocaleString()}
            {listing.priceTo !== undefined && ` — ${listing.priceTo.toLocaleString()}`} kobo
          </span>
        </div>
      )}

      {listing.rentalDetails && (
        <div className="mb-6 rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Rental Details</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Category</dt>
            <dd>{listing.rentalDetails.rentalCategory.replace(/_/g, ' ')}</dd>
            <dt className="text-gray-500">Available</dt>
            <dd>{listing.rentalDetails.quantityAvailable} units</dd>
            <dt className="text-gray-500">Price/Day</dt>
            <dd>{listing.rentalDetails.pricePerDay.toLocaleString()} kobo</dd>
            {listing.rentalDetails.depositAmount !== undefined && (
              <>
                <dt className="text-gray-500">Deposit</dt>
                <dd>{listing.rentalDetails.depositAmount.toLocaleString()} kobo</dd>
              </>
            )}
            <dt className="text-gray-500">Delivery</dt>
            <dd>{listing.rentalDetails.deliveryOption.replace(/_/g, ' ')}</dd>
            {listing.rentalDetails.condition && (
              <>
                <dt className="text-gray-500">Condition</dt>
                <dd>{listing.rentalDetails.condition}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {listing.photos.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-semibold">Photos</h2>
          <div className="grid grid-cols-2 gap-2">
            {listing.photos.map((photo, i) => (
              <div key={i} className="aspect-video rounded-lg bg-gray-100 p-2 text-center text-xs text-gray-400">
                {photo}
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700"
      >
        Contact via WhatsApp
      </a>
    </div>
  );
}
