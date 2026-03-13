import { Skeleton } from '@/components/ui/skeleton';

export default function VendorProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <Skeleton className="mb-4 h-4 w-48" />

      {/* Cover image */}
      <Skeleton className="aspect-[21/9] w-full rounded-lg" />

      {/* Vendor info */}
      <div className="mt-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="mt-2 flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-6 flex gap-4 border-b border-gray-200 pb-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Content */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
