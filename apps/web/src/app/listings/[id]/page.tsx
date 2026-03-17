import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ListingResponse, VendorResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS, RentalCondition } from '@eventtrust/shared';
import { ChevronRight, Truck, MapPin, Package, Shield, CheckCircle2, Star, ImageOff } from 'lucide-react';

const CONDITION_LABELS: Record<string, string> = {
  [RentalCondition.NEW]: 'New',
  [RentalCondition.LIKE_NEW]: 'Like New',
  [RentalCondition.GOOD]: 'Good',
  [RentalCondition.FAIR]: 'Fair',
  [RentalCondition.POOR]: 'Poor',
};
import { serverFetch } from '@/lib/server-api';
import { formatNaira } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PhotoCarousel } from '@/components/ui/photo-carousel';
import { ListingCard } from '@/components/vendor/listing-card';
import { EnquiryButton } from '@/components/vendor/enquiry-button';
import { ShareButton } from '@/components/vendor/share-button';
import { StarRating } from '@/components/ui/star-rating';

const DELIVERY_META: Record<string, { icon: typeof Truck; label: string }> = {
  delivery_only: { icon: Truck, label: 'Delivery only' },
  pickup_only: { icon: MapPin, label: 'Pickup only' },
  both: { icon: Package, label: 'Delivery & Pickup' },
};

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

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await serverFetch<ListingResponse>(`/listings/${id}`);
  if (!listing) notFound();

  // Fetch vendor + all listings in parallel for "similar listings"
  const [vendor, allListings] = await Promise.all([
    serverFetch<VendorResponse>(`/vendors/${listing.vendorId}`),
    serverFetch<{ data: ListingResponse[] }>('/listings', { revalidate: 120 }),
  ]);

  // Similar listings: same type+category, excluding current listing
  const similar = (allListings?.data ?? [])
    .filter(
      (l) =>
        l.id !== listing.id &&
        l.listingType === listing.listingType &&
        (listing.category ? l.category === listing.category : true),
    )
    .slice(0, 4);

  const categoryLabel = listing.category
    ? (CATEGORY_LABELS[listing.category] ?? listing.category)
    : listing.listingType === 'rental'
      ? 'Rental'
      : 'Service';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-surface-500">
          <li>
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href={
                listing.listingType === 'rental'
                  ? listing.rentalDetails?.rentalCategory
                    ? `/equipment?rentalCategory=${listing.rentalDetails.rentalCategory}`
                    : '/equipment'
                  : listing.category
                    ? `/services?category=${listing.category}`
                    : '/services'
              }
              className="hover:text-primary-600 transition-colors"
            >
              {categoryLabel}
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="font-medium text-surface-900 line-clamp-1">{listing.title}</li>
        </ol>
      </nav>

      {/* Type & category badges */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant={listing.listingType === 'rental' ? 'rental' : 'service'}
          className="text-xs"
        >
          {listing.listingType}
        </Badge>
        {listing.category && (
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[listing.category] ?? listing.category}
          </Badge>
        )}
      </div>

      <h1 className="mb-4 text-2xl font-bold">{listing.title}</h1>

      {vendor && (
        <div className="mb-6 rounded-lg border border-surface-200 bg-surface-50 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/vendors/${vendor.slug}`}
                  className="font-semibold text-surface-900 hover:text-primary-600 transition-colors"
                >
                  {vendor.businessName}
                </Link>
                {vendor.status === 'active' && (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary-600"
                    aria-label="Verified vendor"
                  />
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-surface-500">
                {vendor.avgRating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <StarRating value={Math.round(vendor.avgRating)} readonly size="xs" />
                    <span className="font-medium text-surface-700">
                      {vendor.avgRating.toFixed(1)}
                    </span>
                  </span>
                )}
                {vendor.reviewCount > 0 && (
                  <span>
                    ({vendor.reviewCount} review{vendor.reviewCount !== 1 ? 's' : ''})
                  </span>
                )}
                {vendor.area && <span>· {vendor.area}</span>}
              </div>
            </div>
            <Link
              href={`/vendors/${vendor.slug}`}
              className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Photo carousel / fallback */}
      {listing.photos.length > 0 ? (
        <div className="mb-6">
          <PhotoCarousel photos={listing.photos} alt={listing.title} />
        </div>
      ) : (
        <div className="mb-6 flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-surface-100">
          <ImageOff className="h-12 w-12 text-surface-300" />
        </div>
      )}

      <p className="mb-6 whitespace-pre-line text-surface-700">{listing.description}</p>

      {listing.priceFrom !== undefined && (
        <div className="mb-4">
          <span className="text-sm text-surface-500">Price range: </span>
          <span className="font-semibold">
            {formatNaira(listing.priceFrom)}
            {listing.priceTo !== undefined && ` — ${formatNaira(listing.priceTo)}`}
          </span>
        </div>
      )}

      {/* Rental details with icons */}
      {listing.rentalDetails && (
        <div className="mb-6 rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Rental Details</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-surface-500">Category</dt>
            <dd className="capitalize">
              {listing.rentalDetails.rentalCategory.replace(/_/g, ' ')}
            </dd>
            <dt className="text-surface-500">Available</dt>
            <dd>{listing.rentalDetails.quantityAvailable} units</dd>
            <dt className="text-surface-500">Price/Day</dt>
            <dd>{formatNaira(listing.rentalDetails.pricePerDay)}</dd>
            {listing.rentalDetails.depositAmount !== undefined && (
              <>
                <dt className="text-surface-500">Deposit</dt>
                <dd>{formatNaira(listing.rentalDetails.depositAmount)}</dd>
              </>
            )}
            <dt className="text-surface-500">Delivery</dt>
            <dd>
              {(() => {
                const meta = DELIVERY_META[listing.rentalDetails!.deliveryOption];
                if (!meta) return listing.rentalDetails!.deliveryOption.replace(/_/g, ' ');
                const Icon = meta.icon;
                return (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-surface-400" />
                    {meta.label}
                  </span>
                );
              })()}
            </dd>
            {listing.rentalDetails.condition && (
              <>
                <dt className="text-surface-500">Condition</dt>
                <dd>
                  <Badge variant="outline" className="text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    {CONDITION_LABELS[listing.rentalDetails.condition] ??
                      listing.rentalDetails.condition}
                  </Badge>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Contact + Share */}
      {vendor && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <EnquiryButton
            vendorId={vendor.id}
            vendorName={vendor.businessName}
            whatsappNumber={vendor.whatsappNumber}
            listingId={listing.id}
            listingName={listing.title}
            listingType={listing.listingType === 'rental' ? 'Equipment Rental' : 'Service'}
          />
          <ShareButton vendorName={listing.title} shareUrl={`/listings/${listing.id}`} />
          {!vendor.whatsappNumber && (
            <Link
              href={`/vendors/${vendor.slug}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              View Vendor Profile
            </Link>
          )}
        </div>
      )}

      {/* Similar Listings */}
      {similar.length > 0 && (
        <section className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold">Similar Listings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
