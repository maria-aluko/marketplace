import Link from 'next/link';
import type { VendorResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS, VendorStatus } from '@eventtrust/shared';
import { BadgeCheck } from 'lucide-react';
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
          {vendor.status === VendorStatus.ACTIVE && (
            <BadgeCheck
              className="ml-1 inline h-4 w-4 text-green-600"
              aria-label="Verified vendor"
            />
          )}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[vendor.category] ?? vendor.category}
          </Badge>
          <span className="text-xs text-gray-500">{vendor.area}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {vendor.reviewCount > 0 ? (
            <>
              <StarRating value={Math.round(vendor.avgRating)} readonly size="sm" />
              <span className="text-xs text-gray-500">
                {vendor.avgRating.toFixed(1)} ({vendor.reviewCount} review
                {vendor.reviewCount !== 1 ? 's' : ''})
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-primary-600">New on EventTrust</span>
          )}
        </div>
        {priceRange && <p className="mt-1.5 text-sm font-medium text-gray-700">{priceRange}</p>}
      </div>
    </Link>
  );
}
