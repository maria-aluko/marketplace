import { Skeleton } from '@/components/ui/skeleton';

export default function ListingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-44" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-2 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
