import Link from 'next/link';
import type { ListingResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS } from '@eventtrust/shared';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: ListingResponse;
}

function formatPrice(kobo?: number): string {
  if (!kobo) return '';
  return `\u20A6${(kobo / 100).toLocaleString('en-NG')}`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const isRental = listing.listingType === 'rental';

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "block rounded-lg border border-surface-200 bg-white p-4 transition-colors hover:border-primary-300 hover:shadow-md",
        "border-l-4",
        isRental ? "border-l-celebration-500" : "border-l-primary-500"
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant={isRental ? 'rental' : 'service'} className="text-xs">
          {listing.listingType}
        </Badge>
        {listing.category && (
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[listing.category] ?? listing.category}
          </Badge>
        )}
        {listing.rentalDetails?.rentalCategory && (
          <Badge variant="outline" className="text-xs">
            {listing.rentalDetails.rentalCategory.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>
      <h3 className="mt-2 font-medium text-surface-900 line-clamp-1">{listing.title}</h3>
      {listing.reviewCount > 0 && (
        <div className="mt-1 flex items-center gap-1">
          <StarRating value={Math.round(listing.avgRating)} readonly size="xs" />
          <span className="text-xs text-surface-500">({listing.reviewCount})</span>
        </div>
      )}
      <p className="mt-1 text-sm text-surface-500 line-clamp-2">{listing.description}</p>
      {(listing.priceFrom || listing.priceTo) && (
        <p className="mt-2 text-sm font-medium text-surface-700">
          {formatPrice(listing.priceFrom)}
          {listing.priceTo ? ` - ${formatPrice(listing.priceTo)}` : ''}
        </p>
      )}
      {listing.rentalDetails && (
        <p className="mt-1 text-sm text-surface-500">
          {formatPrice(listing.rentalDetails.pricePerDay)}/day
          {listing.rentalDetails.quantityAvailable > 1 &&
            ` · ${listing.rentalDetails.quantityAvailable} available`}
        </p>
      )}
    </Link>
  );
}
