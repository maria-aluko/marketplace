'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form';
import { PortfolioManager } from '@/components/dashboard/portfolio-manager';
import { ReviewsManager } from '@/components/dashboard/reviews-manager';

const statusVariant: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  pending: 'warning',
  active: 'default',
  changes_requested: 'destructive',
  suspended: 'destructive',
};

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // Non-vendor user: simple dashboard
  if (!user.vendorId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Phone:</span> {user.phone}
              </p>
              <p>
                <span className="text-gray-500">Role:</span>{' '}
                <Badge variant="secondary">{user.role}</Badge>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Become a Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                List your business on EventTrust and get discovered by clients in Lagos.
              </p>
              <Link href="/vendor/signup">
                <Button>Create Vendor Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vendor dashboard with tabs
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manage Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-600">
                  Create and manage your service and rental listings.
                </p>
                <Link href="/dashboard/listings">
                  <Button variant="outline">View Listings</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <ProfileEditForm vendorId={user.vendorId} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioM anager vendorId={user.vendorId} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsManager vendorId={user.vendorId} />
        </TabsContent>
      </Tabs>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
