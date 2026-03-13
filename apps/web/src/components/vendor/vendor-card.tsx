import Link from 'next/link';
import type { VendorResponse } from '@eventtrust/shared';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';

interface VendorCardProps {
  vendor: VendorResponse;
}

function formatPrice(kobo?: number): string {
  if (!kobo) return '';
  return `\u20A6${(kobo / 100).toLocaleString()}`;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const priceRange =
    vendor.priceFrom || vendor.priceTo
      ? `${formatPrice(vendor.priceFrom)}${vendor.priceTo ? ` - ${formatPrice(vendor.priceTo)}` : ''}`
      : null;

  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[16/9] bg-gray-100">
        {vendor.coverImageUrl ? (
          <img
            src={vendor.coverImageUrl}
            alt={vendor.businessName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-1">
          {vendor.businessName}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {vendor.category.replace(/_/g, ' ')}
          </Badge>
          <span className="text-xs text-gray-500">{vendor.area}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={Math.round(vendor.avgRating)} readonly size="sm" />
          <span className="text-xs text-gray-500">
            ({vendor.reviewCount})
          </span>
        </div>
        {priceRange && (
          <p className="mt-1.5 text-sm font-medium text-gray-700">{priceRange}</p>
        )}
      </div>
    </Link>
  );
}
