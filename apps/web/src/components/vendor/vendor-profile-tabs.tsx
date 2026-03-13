'use client';

import type { ListingResponse, ReviewResponse, PortfolioItem } from '@eventtrust/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PortfolioGallery } from './portfolio-gallery';
import { ReviewsList } from './reviews-list';
import { ListingCard } from './listing-card';

interface VendorProfileTabsProps {
  vendorId: string;
  description: string;
  instagramHandle?: string;
  listings: ListingResponse[];
  portfolio: PortfolioItem[];
  reviews: ReviewResponse[];
}

export function VendorProfileTabs({
  vendorId,
  description,
  instagramHandle,
  listings,
  portfolio,
  reviews,
}: VendorProfileTabsProps) {
  return (
    <Tabs defaultValue="about" className="mt-6">
      <TabsList className="sticky top-[64px] z-30 w-full justify-start gap-1 rounded-none border-b border-surface-200 bg-white px-0">
        <TabsTrigger
          value="about"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          About
        </TabsTrigger>
        <TabsTrigger
          value="listings"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Listings {listings.length > 0 && `(${listings.length})`}
        </TabsTrigger>
        <TabsTrigger
          value="portfolio"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Portfolio {portfolio.length > 0 && `(${portfolio.length})`}
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="mt-6">
        <p className="whitespace-pre-line text-surface-600">{description}</p>
        {instagramHandle && (
          <p className="mt-2 text-sm text-surface-500">
            Instagram: <span className="font-medium">@{instagramHandle.replace(/^@/, '')}</span>
          </p>
        )}
      </TabsContent>

      <TabsContent value="listings" className="mt-6 content-auto">
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-500">No listings yet.</p>
        )}
      </TabsContent>

      <TabsContent value="portfolio" className="mt-6">
        {portfolio.length > 0 ? (
          <PortfolioGallery items={portfolio} />
        ) : (
          <p className="text-sm text-surface-500">No portfolio items yet.</p>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-6 content-auto">
        <ReviewsList reviews={reviews} vendorId={vendorId} />
      </TabsContent>
    </Tabs>
  );
}
