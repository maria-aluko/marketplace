import Link from 'next/link';
import type { ListingSearchResult } from '@eventtrust/shared';
import {
  VendorCategory,
  RentalCategory,
  CATEGORY_LABELS,
  RENTAL_CATEGORY_LABELS,
} from '@eventtrust/shared';
import { CATEGORY_ICONS, RENTAL_CATEGORY_ICONS } from '@/lib/category-meta';
import { ListingSearchCard } from '@/components/listings/listing-search-card';

const serviceCategories = Object.values(VendorCategory);
const rentalCategories = Object.values(RentalCategory);

interface CategoryBrowserProps {
  activeType: 'services' | 'equipment';
  featuredServices?: ListingSearchResult[];
  featuredEquipment?: ListingSearchResult[];
}

export function CategoryBrowser({
  activeType,
  featuredServices = [],
  featuredEquipment = [],
}: CategoryBrowserProps) {
  const isEquipment = activeType === 'equipment';

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-10">
      {/* Category grid — driven by activeType from HeroSearch toggle */}
      <div className="mx-auto max-w-2xl">
        {!isEquipment ? (
          <div>
            <h3 className="mb-4 text-center text-base font-semibold text-surface-900">
              Browse Services by Category
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {serviceCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/services?category=${category}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                  >
                    <Icon className="h-6 w-6 text-primary-600" />
                    <span className="text-sm font-medium text-surface-700">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-center text-base font-semibold text-surface-900">
              Browse Equipment by Category
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rentalCategories.map((category) => {
                const Icon = RENTAL_CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/equipment?rentalCategory=${category}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-4 text-center transition-colors hover:border-celebration-400 hover:bg-celebration-50"
                  >
                    <Icon className="h-6 w-6 text-celebration-600" />
                    <span className="text-sm font-medium text-surface-700">
                      {RENTAL_CATEGORY_LABELS[category]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Featured listings for the selected type */}
      {((activeType === 'services' && featuredServices.length > 0) ||
        (activeType === 'equipment' && featuredEquipment.length > 0)) && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900">
              {activeType === 'services' ? 'Featured Services' : 'Featured Equipment'}
            </h3>
            <Link
              href={activeType === 'services' ? '/services' : '/equipment'}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {(activeType === 'services' ? featuredServices : featuredEquipment).map((listing) => (
              <div key={listing.id} className="min-w-[280px] shrink-0 snap-start sm:min-w-0">
                <ListingSearchCard listing={listing} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
