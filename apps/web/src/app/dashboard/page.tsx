'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { VendorDashboard } from '@/components/dashboard/vendor-dashboard';
import type { VendorResponse } from '@eventtrust/shared';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Loading...</p>
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
