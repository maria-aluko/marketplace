'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ListingResponse } from '@eventtrust/shared';

export default function ListingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.vendorId) return;

    const fetchListings = async () => {
      setLoading(true);
      const res = await apiClient.get<{ data: ListingResponse[] }>(
        `/vendors/${user.vendorId}/listings`,
      );
      if (res.success && res.data) {
        setListings(res.data.data);
      } else {
        setError(res.error || 'Failed to load listings');
      }
      setLoading(false);
    };

    fetchListings();
  }, [user?.vendorId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user?.vendorId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">You need a vendor profile to manage listings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
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
            <p className="text-gray-500">
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
                  <Badge variant={listing.listingType === 'service' ? 'default' : 'secondary'}>
                    {listing.listingType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                {listing.listingType === 'service' && listing.category && (
                  <p className="mb-1 text-xs text-gray-500">Category: {listing.category}</p>
                )}
                {listing.rentalDetails && (
                  <p className="mb-1 text-xs text-gray-500">
                    {listing.rentalDetails.rentalCategory} —{' '}
                    {listing.rentalDetails.quantityAvailable} available
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/listings/${listing.id}`}>
                    <Button size="sm" variant="outline">
                      View / Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
