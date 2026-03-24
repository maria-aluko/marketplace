import { Skeleton } from '@/components/ui/skeleton';

export default function EquipmentLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Skeleton className="mb-4 h-10 w-full rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-200 bg-white p-4">
            <div className="flex gap-3">
              <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
