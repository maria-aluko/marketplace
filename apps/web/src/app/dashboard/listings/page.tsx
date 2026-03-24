'use client';

import { useAuth } from '@/hooks/use-auth';
import { ListingsManager } from '@/components/dashboard/listings-manager';

export default function ListingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Loading...</p>
      </div>
    );
  }

  if (!user?.vendorId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">You need a vendor profile to manage listings.</p>
      </div>
    );
  }

  return <ListingsManager vendorId={user.vendorId} />;
}
