import Link from 'next/link';
import type { SearchVendorsResponse, SearchListingsResponse } from '@eventtrust/shared';
import { serverFetchRaw } from '@/lib/server-api';
import { HeroSearch } from '@/components/home/hero-search';
import { CategoryBrowser } from '@/components/home/category-browser';
import { VendorCard } from '@/components/vendor/vendor-card';
import { ListingSearchCard } from '@/components/listings/listing-search-card';

export default async function HomePage() {
  const [vendorsResult, servicesResult, equipmentResult] = await Promise.all([
    serverFetchRaw<SearchVendorsResponse>('/search/vendors?limit=6', {
      revalidate: 300,
      tags: ['featured-vendors'],
    }),
    serverFetchRaw<SearchListingsResponse>('/search/listings?listingType=service&limit=6', {
      revalidate: 300,
      tags: ['featured-services'],
    }),
    serverFetchRaw<SearchListingsResponse>('/search/listings?listingType=rental&limit=6', {
      revalidate: 300,
      tags: ['featured-equipment'],
    }),
  ]);

  const featuredVendors = vendorsResult?.vendors ?? [];
  const featuredServices = servicesResult?.listings ?? [];
  const featuredEquipment = equipmentResult?.listings ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary-50 to-white px-4 pb-12 pt-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-surface-900 sm:text-4xl">EventTrust Nigeria</h1>
          <p className="mt-4 max-w-md text-surface-600">
            Find verified event services and equipment rentals in Lagos. Caterers, photographers,
            tents, generators, and more — all reviewed and trusted.
          </p>
          <p className="mt-2 text-sm font-medium text-primary-700">
            Trusted by vendors across Lagos
          </p>

          {/* Hero search bar */}
          <div className="mt-8 w-full">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Category browser — toggle between Services and Equipment */}
      <CategoryBrowser />

      {/* Featured Equipment */}
      {featuredEquipment.length > 0 && (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Featured Equipment</h2>
              <Link
                href="/equipment"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {featuredEquipment.map((listing) => (
                <div key={listing.id} className="min-w-[280px] shrink-0 snap-start sm:min-w-0">
                  <ListingSearchCard listing={listing} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <section className="bg-surface-50 px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Featured Services</h2>
              <Link
                href="/services"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {featuredServices.map((listing) => (
                <div key={listing.id} className="min-w-[280px] shrink-0 snap-start sm:min-w-0">
                  <ListingSearchCard listing={listing} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Vendors (demoted below listings) */}
      {featuredVendors.length > 0 && (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Featured Vendors</h2>
              <Link
                href="/search"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {featuredVendors.map((vendor) => (
                <div key={vendor.id} className="min-w-[280px] shrink-0 snap-start sm:min-w-0">
                  <VendorCard vendor={vendor} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
