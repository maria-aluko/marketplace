import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { VendorResponse, PortfolioItem, ReviewResponse, ListingResponse } from '@eventtrust/shared';
import { serverFetch } from '@/lib/server-api';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { PortfolioGallery } from '@/components/vendor/portfolio-gallery';
import { ReviewsList } from '@/components/vendor/reviews-list';
import { VendorActionBar } from '@/components/vendor/vendor-action-bar';
import { ListingCard } from '@/components/vendor/listing-card';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getVendorBySlug(slug: string) {
  return serverFetch<VendorResponse>(`/vendors/slug/${slug}`, {
    revalidate: 300,
    tags: ['vendor', slug],
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return { title: 'Vendor Not Found — EventTrust' };

  return {
    title: `${vendor.businessName} | ${vendor.category.replace(/_/g, ' ')} in ${vendor.area}`,
    description: vendor.description.slice(0, 160),
    openGraph: {
      title: `${vendor.businessName} | ${vendor.category.replace(/_/g, ' ')} in ${vendor.area}`,
      description: vendor.description.slice(0, 160),
      ...(vendor.coverImageUrl && { images: [{ url: vendor.coverImageUrl }] }),
    },
  };
}

function formatPrice(kobo?: number): string {
  if (!kobo) return '';
  return `\u20A6${(kobo / 100).toLocaleString()}`;
}

export default async function VendorProfilePage({ params }: Props) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const [portfolio, reviews, listings] = await Promise.all([
    serverFetch<PortfolioItem[]>(`/vendors/${vendor.id}/portfolio`),
    serverFetch<ReviewResponse[]>(`/vendors/${vendor.id}/reviews`),
    serverFetch<ListingResponse[]>(`/vendors/${vendor.id}/listings`),
  ]);

  const statusVariant: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
    draft: 'secondary',
    pending: 'warning',
    active: 'default',
    changes_requested: 'destructive',
    suspended: 'destructive',
  };

  const priceRange =
    vendor.priceFrom || vendor.priceTo
      ? `${formatPrice(vendor.priceFrom)}${vendor.priceTo ? ` - ${formatPrice(vendor.priceTo)}` : ''}`
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section>
        {vendor.coverImageUrl && (
          <div className="aspect-[21/9] overflow-hidden rounded-lg bg-gray-100">
            <img
              src={vendor.coverImageUrl}
              alt={vendor.businessName}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {vendor.businessName}
            </h1>
            {vendor.status === 'active' && (
              <Badge variant="default">Verified</Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{vendor.category.replace(/_/g, ' ')}</Badge>
            <span className="text-sm text-gray-500">{vendor.area}</span>
            {priceRange && (
              <span className="text-sm font-medium text-gray-700">{priceRange}</span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={Math.round(vendor.avgRating)} readonly size="md" />
            <span className="text-sm text-gray-500">
              {vendor.avgRating.toFixed(1)} ({vendor.reviewCount} review{vendor.reviewCount !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">About</h2>
        <p className="mt-2 whitespace-pre-line text-gray-600">{vendor.description}</p>
        {vendor.instagramHandle && (
          <p className="mt-2 text-sm text-gray-500">
            Instagram: <span className="font-medium">@{vendor.instagramHandle.replace(/^@/, '')}</span>
          </p>
        )}
      </section>

      {/* Listings */}
      {listings && listings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Services & Rentals</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Portfolio */}
      {portfolio && portfolio.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Portfolio</h2>
          <div className="mt-4">
            <PortfolioGallery items={portfolio} />
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Reviews ({reviews?.length || 0})
        </h2>
        <div className="mt-4">
          <ReviewsList reviews={reviews || []} vendorId={vendor.id} />
        </div>
      </section>

      {/* Sticky mobile action bar */}
      <VendorActionBar
        vendorName={vendor.businessName}
        whatsappNumber={vendor.whatsappNumber}
        slug={vendor.slug}
      />
    </div>
  );
}
