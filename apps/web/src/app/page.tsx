import Link from 'next/link';
import { VendorCategory, CATEGORY_LABELS } from '@eventtrust/shared';
import type { SearchVendorsResponse } from '@eventtrust/shared';
import { serverFetchRaw } from '@/lib/server-api';
import { CATEGORY_ICONS } from '@/lib/category-meta';
import { HeroSearch } from '@/components/home/hero-search';
import { VendorCard } from '@/components/vendor/vendor-card';

const categories = Object.values(VendorCategory);

export default async function HomePage() {
  const searchResult = await serverFetchRaw<SearchVendorsResponse>('/search/vendors?limit=6', {
    revalidate: 300,
    tags: ['featured-vendors'],
  });

  const featuredVendors = searchResult?.vendors ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero section with gradient */}
      <section className="bg-gradient-to-b from-primary-50 to-white px-4 pb-12 pt-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">EventTrust Nigeria</h1>
          <p className="mt-4 max-w-md text-gray-600">
            Find verified event vendors in Lagos. Caterers, photographers, venues, and more — all
            reviewed and trusted.
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

      {/* Category grid with icons */}
      <section className="mx-auto w-full max-w-2xl px-4 py-10">
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <Link
                key={category}
                href={`/search?category=${category}`}
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

      {/* Featured vendors */}
      {featuredVendors.length > 0 && (
        <section className="bg-gray-50 px-4 py-10">
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
