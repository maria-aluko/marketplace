'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VendorCategory,
  RentalCategory,
  DeliveryOption,
  LAGOS_AREAS,
  CATEGORY_LABELS,
  RENTAL_CATEGORY_LABELS,
  DELIVERY_OPTION_LABELS,
} from '@eventtrust/shared';
import type { SearchListingsResponse, ListingSearchResult } from '@eventtrust/shared';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListingSearchCard } from '@/components/listings/listing-search-card';
import { Skeleton } from '@/components/ui/skeleton';

const serviceCategories = Object.values(VendorCategory);
const rentalCategories = Object.values(RentalCategory);
const deliveryOptions = Object.values(DeliveryOption);

interface ListingSearchPageClientProps {
  defaultListingType: 'service' | 'rental';
}

export function ListingSearchPageClient({ defaultListingType }: ListingSearchPageClientProps) {
  const isRental = defaultListingType === 'rental';
  const basePath = isRental ? '/equipment' : '/services';

  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ListingSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const initialQ = searchParams?.get('q') || '';
  const initialCategory = searchParams?.get('category') || '';
  const initialRentalCategory = searchParams?.get('rentalCategory') || '';
  const initialArea = searchParams?.get('area') || '';
  const initialDeliveryOption = searchParams?.get('deliveryOption') || '';
  const initialPriceMin = searchParams?.get('priceMin') || '';
  const initialPriceMax = searchParams?.get('priceMax') || '';

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [rentalCategory, setRentalCategory] = useState(initialRentalCategory);
  const [area, setArea] = useState(initialArea);
  const [deliveryOption, setDeliveryOption] = useState(initialDeliveryOption);
  const [priceMin, setPriceMin] = useState(initialPriceMin);
  const [priceMax, setPriceMax] = useState(initialPriceMax);

  const hasActiveFilters = isRental
    ? !!(q || rentalCategory || area || deliveryOption || priceMin || priceMax)
    : !!(q || category || area || priceMin || priceMax);

  const clearAllFilters = useCallback(() => {
    setQ('');
    setCategory('');
    setRentalCategory('');
    setArea('');
    setDeliveryOption('');
    setPriceMin('');
    setPriceMax('');
  }, []);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buildQuery = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      params.set('listingType', defaultListingType);
      if (q) params.set('q', q);
      if (!isRental && category) params.set('category', category);
      if (isRental && rentalCategory) params.set('rentalCategory', rentalCategory);
      if (area) params.set('area', area);
      if (isRental && deliveryOption) params.set('deliveryOption', deliveryOption);
      if (priceMin) params.set('priceMin', priceMin);
      if (priceMax) params.set('priceMax', priceMax);
      if (cursor) params.set('cursor', cursor);
      return params.toString();
    },
    [
      defaultListingType,
      isRental,
      q,
      category,
      rentalCategory,
      area,
      deliveryOption,
      priceMin,
      priceMax,
    ],
  );

  const fetchListings = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const qs = buildQuery(cursor);
      const result = await apiClient.get<SearchListingsResponse>(`/search/listings?${qs}`);

      if (result.success && result.data) {
        const data = result.data as unknown as SearchListingsResponse;
        if (isLoadMore) {
          setListings((prev) => [...prev, ...data.listings]);
        } else {
          setListings(data.listings);
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
    if (!isRental && category) params.set('category', category);
    if (isRental && rentalCategory) params.set('rentalCategory', rentalCategory);
    if (area) params.set('area', area);
    if (isRental && deliveryOption) params.set('deliveryOption', deliveryOption);
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    const qs = params.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [
    q,
    category,
    rentalCategory,
    area,
    deliveryOption,
    priceMin,
    priceMax,
    isRental,
    basePath,
    router,
  ]);

  // Debounced fetch on filter change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchListings();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchListings]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
          fetchListings(nextCursor);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchListings]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-900">
        {isRental ? 'Rent Equipment' : 'Find Services'}
      </h1>
      <p className="mt-1 text-sm text-surface-500">
        {isRental
          ? 'Browse equipment for rent — tents, chairs, generators, lighting and more'
          : 'Discover verified event services in Lagos — catering, photography, venues and more'}
      </p>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={isRental ? 'Search equipment...' : 'Search services...'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search listings"
        />

        {isRental ? (
          <Select
            value={rentalCategory}
            onValueChange={(v) => setRentalCategory(v === 'all' ? '' : v)}
          >
            <SelectTrigger aria-label="Filter by equipment type">
              <SelectValue placeholder="All equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All equipment</SelectItem>
              {rentalCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {RENTAL_CATEGORY_LABELS[cat] ?? cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {serviceCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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

        {isRental ? (
          <Select
            value={deliveryOption}
            onValueChange={(v) => setDeliveryOption(v === 'all' ? '' : v)}
          >
            <SelectTrigger aria-label="Filter by delivery option">
              <SelectValue placeholder="Any delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any delivery</SelectItem>
              {deliveryOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {DELIVERY_OPTION_LABELS[opt] ?? opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div /> /* spacer for grid alignment */
        )}
      </div>

      {/* Price range */}
      <div className="mt-3 flex items-center gap-3">
        <Input
          type="number"
          placeholder="Min price (₦)"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          aria-label="Minimum price"
          className="max-w-[160px]"
          min={0}
        />
        <span className="text-sm text-surface-400">—</span>
        <Input
          type="number"
          placeholder="Max price (₦)"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          aria-label="Maximum price"
          className="max-w-[160px]"
          min={0}
        />
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {q && (
            <button
              onClick={() => setQ('')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              &ldquo;{q}&rdquo;
              <X className="h-3 w-3" />
            </button>
          )}
          {category && (
            <button
              onClick={() => setCategory('')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {CATEGORY_LABELS[category as VendorCategory] ?? category}
              <X className="h-3 w-3" />
            </button>
          )}
          {rentalCategory && (
            <button
              onClick={() => setRentalCategory('')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {RENTAL_CATEGORY_LABELS[rentalCategory as RentalCategory] ?? rentalCategory}
              <X className="h-3 w-3" />
            </button>
          )}
          {area && (
            <button
              onClick={() => setArea('')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {area}
              <X className="h-3 w-3" />
            </button>
          )}
          {deliveryOption && (
            <button
              onClick={() => setDeliveryOption('')}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {DELIVERY_OPTION_LABELS[deliveryOption as DeliveryOption] ?? deliveryOption}
              <X className="h-3 w-3" />
            </button>
          )}
          {(priceMin || priceMax) && (
            <button
              onClick={() => {
                setPriceMin('');
                setPriceMax('');
              }}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {priceMin && priceMax
                ? `₦${Number(priceMin).toLocaleString()} – ₦${Number(priceMax).toLocaleString()}`
                : priceMin
                  ? `From ₦${Number(priceMin).toLocaleString()}`
                  : `Up to ₦${Number(priceMax).toLocaleString()}`}
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-surface-500 underline hover:text-surface-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="mt-6">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-surface-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-surface-200">
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-surface-900">
            {isRental ? 'No equipment found' : 'No services found'}
          </p>
          <p className="mt-2 text-sm text-surface-500">
            {hasActiveFilters ? 'Try adjusting your filters:' : 'Try a different search term'}
          </p>
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {category && (
                <button
                  onClick={() => setCategory('')}
                  className="rounded-full border border-surface-300 px-3 py-1 text-xs text-surface-600 hover:bg-surface-50"
                >
                  Remove &ldquo;{CATEGORY_LABELS[category as VendorCategory] ?? category}&rdquo;
                  filter
                </button>
              )}
              {rentalCategory && (
                <button
                  onClick={() => setRentalCategory('')}
                  className="rounded-full border border-surface-300 px-3 py-1 text-xs text-surface-600 hover:bg-surface-50"
                >
                  Remove &ldquo;
                  {RENTAL_CATEGORY_LABELS[rentalCategory as RentalCategory] ?? rentalCategory}
                  &rdquo; filter
                </button>
              )}
              {area && (
                <button
                  onClick={() => setArea('')}
                  className="rounded-full border border-surface-300 px-3 py-1 text-xs text-surface-600 hover:bg-surface-50"
                >
                  Search in all areas
                </button>
              )}
              {deliveryOption && (
                <button
                  onClick={() => setDeliveryOption('')}
                  className="rounded-full border border-surface-300 px-3 py-1 text-xs text-surface-600 hover:bg-surface-50"
                >
                  Remove delivery filter
                </button>
              )}
              {(priceMin || priceMax) && (
                <button
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                  }}
                  className="rounded-full border border-surface-300 px-3 py-1 text-xs text-surface-600 hover:bg-surface-50"
                >
                  Remove price filter
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <p className="mb-4 text-sm font-medium text-surface-700">
            {total} {isRental ? 'item' : 'service'}
            {total !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingSearchCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {nextCursor && (
        <div ref={sentinelRef} className="mt-4 flex justify-center py-4">
          {loadingMore && <p className="text-sm text-surface-500">Loading more...</p>}
        </div>
      )}
    </div>
  );
}
