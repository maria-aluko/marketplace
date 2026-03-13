'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VendorCategory, LAGOS_AREAS } from '@eventtrust/shared';
import type { SearchVendorsResponse, VendorResponse } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VendorCard } from '@/components/vendor/vendor-card';
import { Skeleton } from '@/components/ui/skeleton';

const categories = Object.values(VendorCategory);

export function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const initialQ = searchParams?.get('q') || '';
  const initialCategory = searchParams?.get('category') || '';
  const initialArea = searchParams?.get('area') || '';
  const initialVerified = searchParams?.get('verifiedOnly') === 'true';

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [area, setArea] = useState(initialArea);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buildQuery = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (area) params.set('area', area);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (cursor) params.set('cursor', cursor);
      return params.toString();
    },
    [q, category, area, verifiedOnly],
  );

  const fetchVendors = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const qs = buildQuery(cursor);
      const result = await apiClient.get<SearchVendorsResponse>(`/search/vendors?${qs}`);

      if (result.success && result.data) {
        const data = result.data as unknown as SearchVendorsResponse;
        if (isLoadMore) {
          setVendors((prev) => [...prev, ...data.vendors]);
        } else {
          setVendors(data.vendors);
        }
        setTotal(data.total);
        setNextCursor(data.nextCursor);
      }

      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    },
    [buildQuery],
  );

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (area) params.set('area', area);
    if (verifiedOnly) params.set('verifiedOnly', 'true');
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [q, category, area, verifiedOnly, router]);

  // Debounced fetch on filter change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchVendors]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
          fetchVendors(nextCursor);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchVendors]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Find Vendors</h1>
      <p className="mt-1 text-sm text-gray-500">
        Discover verified event vendors in Lagos
      </p>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search vendors..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search vendors"
        />
        <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={area} onValueChange={(v) => setArea(v === 'all' ? '' : v)}>
          <SelectTrigger aria-label="Filter by area">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {LAGOS_AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Verified only
        </label>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mt-4 text-sm text-gray-500">
          {total} vendor{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-gray-900">No vendors found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {nextCursor && (
        <div ref={sentinelRef} className="mt-4 flex justify-center py-4">
          {loadingMore && <p className="text-sm text-gray-500">Loading more...</p>}
        </div>
      )}
    </div>
  );
}
