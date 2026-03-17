'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@eventtrust/shared';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=/admin');
      return;
    }
    if (user.role?.toLowerCase() !== UserRole.ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role?.toLowerCase() !== UserRole.ADMIN) {
    return null;
  }

  return <>{children}</>;
}
