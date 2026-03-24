import { ImageResponse } from 'next/og';
import type { VendorResponse } from '@eventtrust/shared';
import { CATEGORY_LABELS } from '@eventtrust/shared';

export const alt = 'EventTrust Nigeria vendor profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getVendor(slug: string): Promise<VendorResponse | null> {
  try {
    const res = await fetch(`${API_URL}/vendors/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

function renderStars(rating: number) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('');
}

export default async function VendorOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  const name = vendor?.businessName ?? 'EventTrust Vendor';
  const category = vendor ? (CATEGORY_LABELS[vendor.category] ?? vendor.category) : '';
  const area = vendor?.area ?? '';
  const rating = vendor && vendor.avgRating > 0 ? vendor.avgRating : null;
  const reviewCount = vendor?.reviewCount ?? 0;

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
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              backgroundColor: '#2563eb',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 14,
              color: '#bfdbfe',
            }}
          >
            Verified Vendor
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '48px 48px 32px',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
            {name}
          </div>

          <div style={{ display: 'flex', marginTop: 16, gap: 12, alignItems: 'center' }}>
            {category && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {category}
              </div>
            )}
            {area && (
              <div style={{ display: 'flex', fontSize: 22, color: '#64748b' }}>
                📍 {area}
              </div>
            )}
          </div>

          {rating !== null && (
            <div style={{ display: 'flex', marginTop: 20, alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28, color: '#f59e0b' }}>{renderStars(rating)}</span>
              <span style={{ fontSize: 22, color: '#374151', fontWeight: 600 }}>
                {rating.toFixed(1)}
              </span>
              {reviewCount > 0 && (
                <span style={{ fontSize: 20, color: '#9ca3af' }}>
                  ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
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
