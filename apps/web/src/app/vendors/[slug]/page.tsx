import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type {
  VendorResponse,
  PortfolioItem,
  ReviewResponse,
  ListingResponse,
} from '@eventtrust/shared';
import { CATEGORY_LABELS } from '@eventtrust/shared';
import { VendorCategory } from '@eventtrust/shared';
import { ChevronRight, CalendarDays, MessageCircle } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { ShareButton } from '@/components/vendor/share-button';
import { VendorProfileTabs } from '@/components/vendor/vendor-profile-tabs';
import { ListingCard } from '@/components/vendor/listing-card';
import { CATEGORY_ICONS } from '@/lib/category-meta';

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
    title: `${vendor.businessName} | ${CATEGORY_LABELS[vendor.category] ?? vendor.category} in ${vendor.area}`,
    description: vendor.description.slice(0, 160),
    openGraph: {
      title: `${vendor.businessName} | ${CATEGORY_LABELS[vendor.category] ?? vendor.category} in ${vendor.area}`,
      description: vendor.description.slice(0, 160),
    },
  };
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

function CoverImageFallback({ category }: { category: VendorCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <div className="flex aspect-[21/9] items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 via-primary-50 to-white">
      <Icon className="h-16 w-16 text-primary-300" />
    </div>
  );
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

  const resolvedListings = listings ?? [];

  const priceRange =
    vendor.priceFrom || vendor.priceTo
      ? `${formatPrice(vendor.priceFrom)}${vendor.priceTo ? ` - ${formatPrice(vendor.priceTo)}` : ''}`
      : null;

  const categoryLabel = CATEGORY_LABELS[vendor.category] ?? vendor.category;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-surface-500">
          <li>
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href={`/search?category=${vendor.category}`}
              className="hover:text-primary-600 transition-colors"
            >
              {categoryLabel}
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="font-medium text-surface-900">{vendor.businessName}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section>
        {vendor.coverImageUrl ? (
          <div className="aspect-[21/9] overflow-hidden rounded-lg bg-surface-100">
            <img
              src={cloudinaryTransform(vendor.coverImageUrl, 800, 340)}
              alt={vendor.businessName}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <CoverImageFallback category={vendor.category} />
        )}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
              {vendor.businessName}
            </h1>
            {vendor.status === 'active' && <Badge variant="verified">Verified</Badge>}
            <div className="ml-auto">
              <ShareButton vendorName={vendor.businessName} slug={vendor.slug} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{categoryLabel}</Badge>
            <span className="text-sm text-surface-500">{vendor.area}</span>
            {priceRange && (
              <span className="text-sm font-medium text-surface-700">{priceRange}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(vendor.avgRating)} readonly size="md" />
              <span className="text-sm text-surface-500">
                {vendor.avgRating.toFixed(1)} ({vendor.reviewCount} review
                {vendor.reviewCount !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-surface-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Joined {formatMemberSince(vendor.createdAt)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed sections: About | Portfolio | Reviews */}
      <VendorProfileTabs
        vendorId={vendor.id}
        description={vendor.description}
        instagramHandle={vendor.instagramHandle}
        portfolio={portfolio ?? []}
        reviews={reviews ?? []}
      />

      {/* Inline listings section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-surface-900">
          Listings {resolvedListings.length > 0 && `(${resolvedListings.length})`}
        </h2>
        {resolvedListings.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-surface-500 italic">
              To enquire about a service or rental, browse the listings below and tap &lsquo;Contact
              on WhatsApp&rsquo; on the one you&rsquo;re interested in.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resolvedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-surface-500">No listings yet.</p>
        )}
      </section>

      <div className="h-4" />
    </div>
  );
}
