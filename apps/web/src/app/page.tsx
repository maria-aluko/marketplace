import Link from 'next/link';
import type { SearchVendorsResponse, SearchListingsResponse } from '@eventtrust/shared';
import { serverFetchRaw } from '@/lib/server-api';
import { HeroSearch } from '@/components/home/hero-search';
import { CategoryBrowser } from '@/components/home/category-browser';
import { VendorCard } from '@/components/vendor/vendor-card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Star,
  MapPin,
  Search,
  GitCompare,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react';

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-celebration-50 px-4 pb-8 pt-16">
        {/* Decorative background — zero network cost, pure CSS/SVG */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Subtle dot grid */}
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#059669" fillOpacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />
          </svg>
          {/* Soft ambient blobs */}
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary-200 opacity-20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-60 w-60 rounded-full bg-celebration-200 opacity-25 blur-3xl" />
          <div className="absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-celebration-100 opacity-30 blur-2xl" />
        </div>

        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="font-display text-4xl font-bold text-surface-900 sm:text-5xl">
            Find Trusted Vendors <span className="text-celebration-600">for Your Lagos Event</span>
          </h1>
          <p className="mt-4 max-w-md text-surface-600">
            Caterers, photographers, venues, tents, generators — all verified and reviewed.
          </p>

          {/* Trust pills */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified vendors
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              <Star className="h-3.5 w-3.5" />
              Real reviews
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              <MapPin className="h-3.5 w-3.5" />
              Lagos only
            </span>
          </div>

          {/* Hero search bar */}
          <div className="mt-8 w-full">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* How It Works strip */}
      <section className="border-y border-surface-100 bg-surface-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display mb-8 text-center text-xl font-bold text-surface-900">
            How EventTrust Works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <Search className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-surface-900">Search</h3>
              <p className="mt-1 text-sm text-surface-500">
                Browse verified vendors by category, area, and price range.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <GitCompare className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-surface-900">Compare</h3>
              <p className="mt-1 text-sm text-surface-500">
                Read real client reviews and compare portfolios side by side.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <MessageCircle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-surface-900">Contact on WhatsApp</h3>
              <p className="mt-1 text-sm text-surface-500">
                Reach vendors directly — no middlemen, no commission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category browser + featured listings — single toggle */}
      <CategoryBrowser featuredServices={featuredServices} featuredEquipment={featuredEquipment} />

      {/* Featured Vendors */}
      {featuredVendors.length > 0 && (
        <section className="px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-surface-900">Featured Vendors</h2>
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

      {/* Why EventTrust? */}
      <section className="bg-primary-50/50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display mb-8 text-center text-xl font-bold text-surface-900">
            Why Choose EventTrust?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-surface-200 bg-white p-6">
              <BadgeCheck className="mb-3 h-7 w-7 text-verified-DEFAULT" />
              <h3 className="font-semibold text-surface-900">Verified Vendors</h3>
              <p className="mt-1 text-sm text-surface-500">
                Every vendor is manually reviewed before listing.
              </p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-6">
              <Star className="mb-3 h-7 w-7 text-celebration-600" />
              <h3 className="font-semibold text-surface-900">Real Client Reviews</h3>
              <p className="mt-1 text-sm text-surface-500">
                Reviews from people who actually used the service.
              </p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-6">
              <MessageCircle className="mb-3 h-7 w-7 text-primary-600" />
              <h3 className="font-semibold text-surface-900">Direct WhatsApp Contact</h3>
              <p className="mt-1 text-sm text-surface-500">No commission, no middlemen.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
