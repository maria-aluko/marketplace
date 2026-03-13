import Link from 'next/link';
import type { ListingSearchResult } from '@eventtrust/shared';
import { CATEGORY_LABELS, RENTAL_CATEGORY_LABELS } from '@eventtrust/shared';
import { BadgeCheck, Truck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { CATEGORY_ICONS, RENTAL_CATEGORY_ICONS } from '@/lib/category-meta';

interface ListingSearchCardProps {
  listing: ListingSearchResult;
}

function formatPrice(kobo?: number): string {
  if (!kobo) return '';
  return `₦${(kobo / 100).toLocaleString()}`;
}

function formatDeliveryOption(option: string): string {
  return option.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ListingSearchCard({ listing }: ListingSearchCardProps) {
  const isRental = listing.listingType === 'rental';
  const vendor = listing.vendor;

  const FallbackIcon = isRental
    ? listing.rentalDetails?.rentalCategory
      ? RENTAL_CATEGORY_ICONS[listing.rentalDetails.rentalCategory]
      : null
    : listing.category
      ? CATEGORY_ICONS[listing.category]
      : null;

  const photo = listing.photos?.[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image / fallback */}
      <div className="aspect-[16/9] bg-surface-100">
        {photo ? (
          <img
            src={cloudinaryTransform(photo, 375, 200)}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-surface-300">
            {FallbackIcon ? (
              <FallbackIcon className="h-12 w-12" />
            ) : (
              <span className="text-sm text-surface-400">No image</span>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Type + category badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={isRental ? 'rental' : 'service'} className="text-xs">
            {isRental ? 'Rental' : 'Service'}
          </Badge>
          {listing.category && (
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[listing.category] ?? listing.category}
            </Badge>
          )}
          {listing.rentalDetails?.rentalCategory && (
            <Badge variant="outline" className="text-xs">
              {RENTAL_CATEGORY_LABELS[listing.rentalDetails.rentalCategory] ??
                listing.rentalDetails.rentalCategory.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 font-semibold text-surface-900 group-hover:text-primary-600 line-clamp-1">
          {listing.title}
        </h3>

        {/* Description */}
        <p className="mt-1 text-sm text-surface-500 line-clamp-2">{listing.description}</p>

        {/* Price info */}
        <div className="mt-2">
          {isRental && listing.rentalDetails ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-surface-700">
                {formatPrice(listing.rentalDetails.pricePerDay)}/day
              </span>
              {listing.rentalDetails.quantityAvailable > 1 && (
                <span className="text-surface-500">
                  {listing.rentalDetails.quantityAvailable} available
                </span>
              )}
              {listing.rentalDetails.deliveryOption && (
                <span className="inline-flex items-center gap-1 text-surface-500">
                  <Truck className="h-3.5 w-3.5" />
                  {formatDeliveryOption(listing.rentalDetails.deliveryOption)}
                </span>
              )}
            </div>
          ) : (
            (listing.priceFrom || listing.priceTo) && (
              <p className="text-sm font-medium text-surface-700">
                {formatPrice(listing.priceFrom)}
                {listing.priceTo ? ` – ${formatPrice(listing.priceTo)}` : ''}
              </p>
            )
          )}
        </div>

        {/* Vendor mini-info */}
        <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-medium text-surface-700">
                {vendor.businessName}
              </span>
              {vendor.verified && (
                <BadgeCheck
                  className="h-3.5 w-3.5 shrink-0 text-primary-600"
                  aria-label="Verified vendor"
                />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-xs text-surface-500">
                <MapPin className="h-3 w-3" />
                {vendor.area}
              </span>
              {vendor.reviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <StarRating value={Math.round(vendor.avgRating)} readonly size="xs" />
                  <span className="text-xs text-surface-500">({vendor.reviewCount})</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
