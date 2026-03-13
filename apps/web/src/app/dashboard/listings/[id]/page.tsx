'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceListingForm } from '@/components/listings/service-listing-form';
import { RentalListingForm } from '@/components/listings/rental-listing-form';
import Link from 'next/link';
import type { ListingResponse } from '@eventtrust/shared';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      const res = await apiClient.get<{ data: ListingResponse }>(`/listings/${id}`);
      if (res.success && res.data) {
        const data =
          (res.data as unknown as { data: ListingResponse }).data ??
          (res.data as unknown as ListingResponse);
        setListing(data);
      } else {
        setError(res.error || 'Failed to load listing');
      }
      setLoading(false);
    };

    fetchListing();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await apiClient.delete(`/listings/${id}`);
    if (res.success) {
      router.push('/dashboard/listings');
    } else {
      setError(res.error || 'Failed to delete listing');
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Listing not found.</p>
      </div>
    );
  }

  const koboToNaira = (val?: number) => (val != null ? String(val / 100) : '');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <div className="flex gap-2">
          <Link href={`/listings/${id}`}>
            <Button variant="outline" size="sm">
              View Public Page
            </Button>
          </Link>
          <Link href="/dashboard/listings">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {listing.listingType === 'service' ? 'Service Details' : 'Rental Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listing.listingType === 'service' ? (
            <ServiceListingForm
              listingId={listing.id}
              initialData={{
                title: listing.title,
                description: listing.description,
                category: listing.category?.toLowerCase() ?? '',
                priceFrom: koboToNaira(listing.priceFrom),
                priceTo: koboToNaira(listing.priceTo),
                photos: listing.photos,
              }}
            />
          ) : (
            <RentalListingForm
              listingId={listing.id}
              initialData={{
                title: listing.title,
                description: listing.description,
                rentalCategory: listing.rentalDetails?.rentalCategory?.toLowerCase() ?? '',
                quantityAvailable: String(listing.rentalDetails?.quantityAvailable ?? ''),
                pricePerDay: koboToNaira(listing.rentalDetails?.pricePerDay),
                depositAmount: koboToNaira(listing.rentalDetails?.depositAmount),
                deliveryOption: listing.rentalDetails?.deliveryOption?.toLowerCase() ?? '',
                condition: listing.rentalDetails?.condition ?? '',
                photos: listing.photos,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete this listing</p>
              <p className="text-sm text-gray-500">
                Once deleted, this listing cannot be recovered.
              </p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                Delete Listing
              </Button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
