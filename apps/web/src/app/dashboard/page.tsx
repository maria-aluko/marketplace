'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form';
import { PortfolioManager } from '@/components/dashboard/portfolio-manager';
import { ReviewsManager } from '@/components/dashboard/reviews-manager';
import { BookingsManager } from '@/components/dashboard/bookings-manager';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { InvoiceBrandingSettings } from '@/components/dashboard/invoice-branding-settings';
import { SubscriptionBadge } from '@/components/dashboard/subscription-badge';
import ListingsPage from './listings/page';
import { SubscriptionTier } from '@eventtrust/shared';
import type { VendorResponse } from '@eventtrust/shared';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [vendor, setVendor] = useState<VendorResponse | null>(null);

  useEffect(() => {
    if (user?.vendorId) {
      apiClient.get<{ data: VendorResponse }>(`/vendors/${user.vendorId}`).then((res) => {
        if (res.success && res.data) {
          setVendor((res.data as any).data ?? null);
        }
      });
    }
  }, [user?.vendorId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-surface-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // Non-vendor user: client dashboard
  if (!user.vendorId) {
    return <ClientDashboard user={user} />;
  }

  const subscriptionTier = (vendor?.subscriptionTier as SubscriptionTier) ?? SubscriptionTier.FREE;

  // Vendor dashboard with tabs
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-surface-500">Plan:</span>
        <SubscriptionBadge tier={subscriptionTier} />
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bookings & Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingsManager vendorId={user.vendorId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manage Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <ListingsPage />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <ProfileEditForm vendorId={user.vendorId} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioManager vendorId={user.vendorId} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsManager vendorId={user.vendorId} />
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceBrandingSettings vendorId={user.vendorId} subscriptionTier={subscriptionTier} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
