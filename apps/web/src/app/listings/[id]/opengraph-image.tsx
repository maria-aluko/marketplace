import { ImageResponse } from 'next/og';
import type { ListingResponse, VendorResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS, RENTAL_CATEGORY_LABELS } from '@eventtrust/shared';
import { formatPrice } from '@/lib/utils';

export const alt = 'EventTrust Nigeria listing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getListing(id: string): Promise<ListingResponse | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getVendor(vendorId: string): Promise<VendorResponse | null> {
  try {
    const res = await fetch(`${API_URL}/vendors/${vendorId}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function ListingOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            fontSize: 48,
            fontWeight: 800,
            fontFamily: 'sans-serif',
          }}
        >
          EventTrust Nigeria
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const vendor = await getVendor(listing.vendorId);

  const isRental = listing.listingType === 'rental';
  const typeLabel = isRental ? 'Rental' : 'Service';
  const typeColor = isRental ? '#7c3aed' : '#059669';
  const typeBg = isRental ? '#f5f3ff' : '#ecfdf5';

  const categoryLabel = listing.category
    ? (CATEGORY_LABELS[listing.category] ?? listing.category)
    : listing.rentalDetails?.rentalCategory
      ? (RENTAL_CATEGORY_LABELS[listing.rentalDetails.rentalCategory] ??
        listing.rentalDetails.rentalCategory.replace(/_/g, ' '))
      : null;

  const price = isRental
    ? listing.rentalDetails?.pricePerDay
      ? `${formatPrice(listing.rentalDetails.pricePerDay)}/day`
      : null
    : listing.priceFrom
      ? `From ${formatPrice(listing.priceFrom)}`
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header band */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#1d4ed8',
            padding: '28px 48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: '#ffffff',
              fontSize: 18,
              fontWeight: 800,
              color: '#1d4ed8',
            }}
          >
            ET
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
            EventTrust Nigeria
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '40px 48px 32px',
            justifyContent: 'center',
          }}
        >
          {/* Badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                backgroundColor: typeBg,
                color: typeColor,
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {typeLabel}
            </div>
            {categoryLabel && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 20,
                }}
              >
                {categoryLabel}
              </div>
            )}
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
            }}
          >
            {listing.title.length > 60 ? listing.title.slice(0, 57) + '...' : listing.title}
          </div>

          {/* Price + vendor */}
          <div style={{ display: 'flex', marginTop: 20, gap: 24, alignItems: 'center' }}>
            {price && (
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#1d4ed8' }}>
                {price}
              </div>
            )}
            {vendor && (
              <div style={{ display: 'flex', fontSize: 22, color: '#64748b' }}>
                by {vendor.businessName}
                {vendor.area ? ` · ${vendor.area}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            padding: '16px 48px',
            borderTop: '1px solid #e2e8f0',
            fontSize: 18,
            color: '#94a3b8',
          }}
        >
          eventtrust.com.ng
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
