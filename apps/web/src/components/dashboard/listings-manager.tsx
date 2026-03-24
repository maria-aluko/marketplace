'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Copy, Zap, X } from 'lucide-react';
import type {
  ListingResponse,
  CreateServiceListingPayload,
  CreateRentalListingPayload,
} from '@eventtrust/shared';

interface ListingsManagerProps {
  vendorId: string;
}

export function ListingsManager({ vendorId }: ListingsManagerProps) {
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const res = await apiClient.get<{ data: ListingResponse[] }>(
      `/vendors/${vendorId}/listings`,
    );
    if (res.success && res.data) {
      setListings(res.data.data);
    } else {
      setError(res.error || 'Failed to load listings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleDuplicate = async (listing: ListingResponse) => {
    setDuplicating(listing.id);

    let res;
    if (listing.listingType === 'rental' && listing.rentalDetails) {
      const payload: CreateRentalListingPayload = {
        title: `Copy of ${listing.title}`,
        description: listing.description,
        rentalCategory: listing.rentalDetails.rentalCategory,
        quantityAvailable: listing.rentalDetails.quantityAvailable,
        pricePerDay: listing.rentalDetails.pricePerDay,
        depositAmount: listing.rentalDetails.depositAmount,
        deliveryOption: listing.rentalDetails.deliveryOption,
        condition: listing.rentalDetails.condition,
        photos: [],
      };
      res = await apiClient.post('/listings/rental', payload);
    } else {
      const payload: CreateServiceListingPayload = {
        title: `Copy of ${listing.title}`,
        description: listing.description,
        category: listing.category!,
        priceFrom: listing.priceFrom,
        priceTo: listing.priceTo,
        photos: [],
      };
      res = await apiClient.post('/listings/service', payload);
    }

    setDuplicating(null);

    if (res.success) {
      await fetchListings();
    } else {
      setError('Failed to duplicate listing. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Loading...</p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">You need a vendor profile to manage listings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {boostMessage && (
        <div className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">{boostMessage}</p>
          <button
            onClick={() => setBoostMessage(null)}
            className="shrink-0 text-amber-600 hover:text-amber-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Link href="/dashboard/listings/new/service">
            <Button size="sm" variant="outline">
              Add Service
            </Button>
          </Link>
          <Link href="/dashboard/listings/new/rental">
            <Button size="sm" variant="outline">
              Add Rental
            </Button>
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-surface-500">
              No listings yet. Create your first listing to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{listing.title}</CardTitle>
                  <Badge variant={listing.listingType === 'service' ? 'service' : 'rental'}>
                    {listing.listingType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-surface-600 line-clamp-2">{listing.description}</p>
                {listing.listingType === 'service' && listing.category && (
                  <p className="mb-1 text-xs text-surface-500">Category: {listing.category}</p>
                )}
                {listing.rentalDetails && (
                  <p className="mb-1 text-xs text-surface-500">
                    {listing.rentalDetails.rentalCategory} —{' '}
                    {listing.rentalDetails.quantityAvailable} available
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/listings/${listing.id}`}>
                    <Button size="sm" variant="outline">
                      View / Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(listing)}
                    disabled={duplicating === listing.id}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {duplicating === listing.id ? 'Duplicating...' : 'Duplicate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setBoostMessage('Boost listing is coming soon — available on the Pro plan.')
                    }
                    className="text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <Zap className="mr-1 h-3.5 w-3.5" />
                    Boost
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
