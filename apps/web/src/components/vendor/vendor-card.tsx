import Link from 'next/link';
import type { VendorResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS, VendorStatus } from '@eventtrust/shared';
import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ProfileCompletenessRing } from '@/components/ui/profile-completeness-ring';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { CATEGORY_ICONS } from '@/lib/category-meta';
import { formatPrice } from '@/lib/utils';

interface VendorCardProps {
  vendor: VendorResponse;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const priceRange =
    vendor.priceFrom || vendor.priceTo
      ? `${formatPrice(vendor.priceFrom)}${vendor.priceTo ? ` - ${formatPrice(vendor.priceTo)}` : ''}`
      : null;

  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group block overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm transition-colors hover:border-primary-300 hover:shadow-md"
    >
      <div className="aspect-[16/9] bg-surface-100">
        {vendor.coverImageUrl ? (
          <img
            src={cloudinaryTransform(vendor.coverImageUrl, 375, 200)}
            alt={vendor.businessName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
            {(() => { const Icon = CATEGORY_ICONS[vendor.category]; return Icon ? <Icon className="h-10 w-10 text-primary-400" /> : null; })()}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 line-clamp-1">
          {vendor.businessName}
          {vendor.status === VendorStatus.ACTIVE && (
            <BadgeCheck
              className="ml-1 inline h-4 w-4 text-primary-600"
              aria-label="Verified vendor"
            />
          )}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[vendor.category] ?? vendor.category}
          </Badge>
          <span className="text-xs text-surface-500">{vendor.area}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {vendor.reviewCount > 0 ? (
            <>
              <StarRating value={Math.round(vendor.avgRating)} readonly size="sm" />
              <span className="text-xs text-surface-500">
                {vendor.avgRating.toFixed(1)} ({vendor.reviewCount} review
                {vendor.reviewCount !== 1 ? 's' : ''})
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-primary-600">New on EventTrust</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {priceRange && <p className="text-sm font-medium text-surface-700">{priceRange}</p>}
          {vendor.profileCompleteScore < 100 && (
            <ProfileCompletenessRing score={vendor.profileCompleteScore} />
          )}
        </div>
      </div>
    </Link>
  );
}
