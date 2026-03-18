'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { VendorDashboard } from '@/components/dashboard/vendor-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole } from '@eventtrust/shared';
import type { VendorResponse } from '@eventtrust/shared';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorResponse | null>(null);

  useEffect(() => {
    if (user?.vendorId) {
      apiClient.get<{ data: VendorResponse }>(`/vendors/${user.vendorId}`).then((res) => {
        if (res.success && res.data) {
          setVendor((res.data as any).data ?? null);
        }
      });
    }
  }, [user?.vendorId]);

  useEffect(() => {
    if (!isLoading && user?.role?.toLowerCase() === UserRole.ADMIN) {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  if (!user.vendorId) {
    return <ClientDashboard user={user} />;
  }

  return <VendorDashboard user={user} vendor={vendor} />;
}
