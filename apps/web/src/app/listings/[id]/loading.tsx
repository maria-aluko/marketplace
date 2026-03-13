import { Skeleton } from '@/components/ui/skeleton';

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <Skeleton className="mb-4 h-4 w-56" />

      {/* Badges */}
      <div className="mb-2 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="mb-4 h-8 w-3/4" />

      {/* Vendor link */}
      <Skeleton className="mb-4 h-4 w-32" />

      {/* Photo carousel */}
      <Skeleton className="mb-6 aspect-[3/2] w-full rounded-lg" />

      {/* Description */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Price */}
      <Skeleton className="mb-4 h-5 w-40" />

      {/* CTA button */}
      <Skeleton className="h-10 w-48 rounded-md" />
    </div>
  );
}
