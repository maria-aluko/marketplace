'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Clock, Star, AlertTriangle, ShieldAlert, UserCircle } from 'lucide-react';

interface AnalyticsData {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  totalReviews: number;
  pendingReviews: number;
  openDisputes: number;
  totalClients: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'default' | 'green' | 'amber' | 'red' | 'blue';
}

function StatCard({ label, value, icon, accent = 'default' }: StatCardProps) {
  const accentStyles = {
    default: 'bg-white border-surface-200',
    green:   'bg-green-50 border-green-200',
    amber:   'bg-amber-50 border-amber-200',
    red:     'bg-red-50 border-red-200',
    blue:    'bg-blue-50 border-blue-200',
  };
  const iconStyles = {
    default: 'text-surface-400',
    green:   'text-green-500',
    amber:   'text-amber-500',
    red:     'text-red-500',
    blue:    'text-blue-500',
  };
  const valueStyles = {
    default: 'text-surface-900',
    green:   'text-green-700',
    amber:   'text-amber-700',
    red:     'text-red-700',
    blue:    'text-blue-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${accentStyles[accent]}`}>
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ${iconStyles[accent]}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueStyles[accent]}`}>{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-surface-500">{label}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await apiClient.get<{ data: AnalyticsData }>('/admin/analytics');
      if (res.success && res.data) {
        setData(res.data.data);
      } else {
        setError('Failed to load analytics');
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) return <p className="py-4 text-sm text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-500">
          Vendors
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Vendors"
            value={data.totalVendors}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Active Vendors"
            value={data.activeVendors}
            icon={<UserCheck className="h-4 w-4" />}
            accent="green"
          />
          <StatCard
            label="Pending Approval"
            value={data.pendingVendors}
            icon={<Clock className="h-4 w-4" />}
            accent="amber"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-500">
          Reviews
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Reviews"
            value={data.totalReviews}
            icon={<Star className="h-4 w-4" />}
          />
          <StatCard
            label="Pending Reviews"
            value={data.pendingReviews}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="amber"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-500">
          Trust & Clients
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Open Disputes"
            value={data.openDisputes}
            icon={<ShieldAlert className="h-4 w-4" />}
            accent={data.openDisputes > 0 ? 'red' : 'default'}
          />
          <StatCard
            label="Total Clients"
            value={data.totalClients}
            icon={<UserCircle className="h-4 w-4" />}
            accent="blue"
          />
        </div>
      </div>
    </div>
  );
}
