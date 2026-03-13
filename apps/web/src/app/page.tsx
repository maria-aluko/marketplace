import Link from 'next/link';
import {
  VendorCategory,
  RentalCategory,
  CATEGORY_LABELS,
  RENTAL_CATEGORY_LABELS,
} from '@eventtrust/shared';
import type { SearchVendorsResponse, SearchListingsResponse } from '@eventtrust/shared';
import { Briefcase, Package } from 'lucide-react';
import { serverFetchRaw } from '@/lib/server-api';
import { CATEGORY_ICONS, RENTAL_CATEGORY_ICONS } from '@/lib/category-meta';
import { HeroSearch } from '@/components/home/hero-search';
import { VendorCard } from '@/components/vendor/vendor-card';
import { ListingSearchCard } from '@/components/listings/listing-search-card';

const serviceCategories = Object.values(VendorCategory);
const rentalCategories = Object.values(RentalCategory);

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
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">EventTrust Nigeria</h1>
          <p className="mt-4 max-w-md text-gray-600">
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

      {/* Dual-path CTA cards */}
      <section className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/services"
            className="flex items-center gap-4 rounded-xl border-2 border-primary-200 bg-primary-50 p-5 transition-colors hover:border-primary-400 hover:bg-primary-100"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Find Services</h2>
              <p className="text-sm text-gray-600">
                Caterers, photographers, DJs, planners &amp; more
              </p>
            </div>
          </Link>
          <Link
            href="/equipment"
            className="flex items-center gap-4 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-5 transition-colors hover:border-yellow-400 hover:bg-yellow-100"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-yellow-500 text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rent Equipment</h2>
              <p className="text-sm text-gray-600">
                Tents, chairs, generators, lighting &amp; more
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Browse Services by category */}
      <section className="mx-auto w-full max-w-2xl px-4 py-10">
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
          Browse Services by Category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {serviceCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <Link
                key={category}
                href={`/services?category=${category}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
              >
                <Icon className="h-6 w-6 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">
                  {CATEGORY_LABELS[category]}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Browse Equipment by category */}
      <section className="bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
            Browse Equipment by Category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rentalCategories.map((category) => {
              const Icon = RENTAL_CATEGORY_ICONS[category];
              return (
                <Link
                  key={category}
                  href={`/equipment?rentalCategory=${category}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-center transition-colors hover:border-yellow-400 hover:bg-yellow-50"
                >
                  <Icon className="h-6 w-6 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {RENTAL_CATEGORY_LABELS[category]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Equipment */}
      {featuredEquipment.length > 0 && (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Featured Equipment</h2>
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
        <section className="bg-gray-50 px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Featured Services</h2>
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
              <h2 className="text-lg font-semibold text-gray-900">Featured Vendors</h2>
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
