'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ListingSearchResult } from '@eventtrust/shared';
import { Briefcase, Package } from 'lucide-react';
import { ListingSearchCard } from '@/components/listings/listing-search-card';

type Selection = 'services' | 'equipment';

interface FeaturedListingsProps {
  services: ListingSearchResult[];
  equipment: ListingSearchResult[];
}

export function FeaturedListings({ services, equipment }: FeaturedListingsProps) {
  const [selected, setSelected] = useState<Selection>('services');

  const hasServices = services.length > 0;
  const hasEquipment = equipment.length > 0;

  if (!hasServices && !hasEquipment) return null;

  const listings = selected === 'services' ? services : equipment;
  const viewAllHref = selected === 'services' ? '/services' : '/equipment';
  const title = selected === 'services' ? 'Featured Services' : 'Featured Equipment';

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all →
          </Link>
        </div>

        {/* Toggle buttons */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelected('services')}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
              selected === 'services'
                ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-200'
                : 'border-primary-200 bg-primary-50 hover:border-primary-400 hover:bg-primary-100'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-surface-900">Services</span>
          </button>

          <button
            type="button"
            onClick={() => setSelected('equipment')}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
              selected === 'equipment'
                ? 'border-celebration-500 bg-celebration-100 ring-2 ring-celebration-200'
                : 'border-celebration-200 bg-celebration-50 hover:border-celebration-400 hover:bg-celebration-100'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-celebration-500 text-white">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-surface-900">Equipment</span>
          </button>
        </div>

        {/* Listing cards */}
        {listings.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {listings.map((listing) => (
              <div key={listing.id} className="min-w-[280px] shrink-0 snap-start sm:min-w-0">
                <ListingSearchCard listing={listing} compact />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-surface-500">
            No featured {selected === 'services' ? 'services' : 'equipment'} yet.
          </p>
        )}
      </div>
    </section>
  );
}
