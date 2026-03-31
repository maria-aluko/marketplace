'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { VendorResponse } from '@eventtrust/shared';

export function VendorQueue() {
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [changesNoteMap, setChangesNoteMap] = useState<Record<string, string>>({});
  const [expandedChangesId, setExpandedChangesId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    const res = await apiClient.get<{ data: VendorResponse[] }>('/admin/vendors/pending?limit=50');
    if (res.success && res.data) {
      setVendors(res.data.data);
    } else {
      setError('Failed to load pending vendors');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async (vendorId: string) => {
    setActionLoading(vendorId);
    await apiClient.patch(`/vendors/${vendorId}/status`, { newStatus: 'ACTIVE' });
    setActionLoading(null);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(vendorId); return next; });
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
  };

  const handleRequestChanges = async (vendorId: string) => {
    const adminNote = changesNoteMap[vendorId]?.trim() || undefined;
    setActionLoading(vendorId);
    await apiClient.patch(`/vendors/${vendorId}/status`, {
      newStatus: 'CHANGES_REQUESTED',
      reason: 'Please review the feedback from the EventTrust team.',
      adminNote,
    });
    setActionLoading(null);
    setExpandedChangesId(null);
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        apiClient.patch(`/vendors/${id}/status`, { newStatus: 'ACTIVE' }),
      ),
    );
    setBulkLoading(false);
    setVendors((prev) => prev.filter((v) => !selectedIds.has(v.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayed = search
    ? vendors.filter((v) => v.businessName.toLowerCase().includes(search.toLowerCase()))
    : vendors;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name..."
          className="h-11 w-full rounded-md border border-surface-300 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-2">
          <span className="text-sm font-medium text-primary-800">
            {selectedIds.size} vendor{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkLoading}
          >
            {bulkLoading ? 'Approving...' : `Approve Selected (${selectedIds.size})`}
          </Button>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="rounded-lg border border-dashed border-surface-300 py-10 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-surface-300" />
          <p className="text-sm text-surface-500">
            {search ? 'No vendors match your search.' : 'No pending vendor applications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-lg border border-surface-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(vendor.id)}
                  onChange={() => toggleSelect(vendor.id)}
                  className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600"
                  aria-label={`Select ${vendor.businessName}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-surface-900">{vendor.businessName}</p>
                      {vendor.category && (
                        <p className="text-xs text-surface-500 capitalize">
                          {vendor.category.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-400">
                        {new Date(vendor.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs font-medium text-primary-600">
                        {vendor.profileCompleteScore}% complete
                      </p>
                    </div>
                  </div>

                  {vendor.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-surface-600">
                      {vendor.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/vendors/${vendor.slug}`}
                      target="_blank"
                      className="text-xs text-primary-600 hover:text-primary-800 underline"
                    >
                      View profile ↗
                    </Link>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedChangesId((prev) =>
                            prev === vendor.id ? null : vendor.id,
                          )
                        }
                        disabled={actionLoading === vendor.id}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                        Request Changes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(vendor.id)}
                        disabled={actionLoading === vendor.id}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {actionLoading === vendor.id ? 'Approving...' : 'Approve'}
                      </Button>
                    </div>
                  </div>

                  {expandedChangesId === vendor.id && (
                    <div className="mt-3 space-y-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                      <label className="block text-xs font-medium text-orange-800">
                        Note for vendor (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={changesNoteMap[vendor.id] ?? ''}
                        onChange={(e) =>
                          setChangesNoteMap((prev) => ({ ...prev, [vendor.id]: e.target.value }))
                        }
                        placeholder="Describe what needs to be fixed or improved..."
                        className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedChangesId(null)}
                          className="text-surface-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequestChanges(vendor.id)}
                          disabled={actionLoading === vendor.id}
                          className="border-orange-300 bg-orange-600 text-white hover:bg-orange-700"
                        >
                          {actionLoading === vendor.id ? 'Sending...' : 'Send Request'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
