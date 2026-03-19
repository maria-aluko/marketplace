'use client';

import { useState } from 'react';
import { LayoutDashboard, CalendarCheck, Store, Building2, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionBadge } from '@/components/dashboard/subscription-badge';
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form';
import { PortfolioManager } from '@/components/dashboard/portfolio-manager';
import { ReviewsManager } from '@/components/dashboard/reviews-manager';
import { BookingsManager } from '@/components/dashboard/bookings-manager';
import { InvoiceBrandingSettings } from '@/components/dashboard/invoice-branding-settings';
import { EnquiriesManager } from '@/components/dashboard/enquiries-manager';
import { BudgetManager } from '@/components/dashboard/budget-manager';
import { GuestManager } from '@/components/dashboard/guest-manager';
import ListingsPage from '@/app/dashboard/listings/page';
import { cn, getGreeting } from '@/lib/utils';
import { SubscriptionTier } from '@eventtrust/shared';
import type { AuthUser, VendorResponse } from '@eventtrust/shared';

type VendorTab = 'home' | 'bookings' | 'listings' | 'profile' | 'plan';

interface VendorDashboardProps {
  user: AuthUser;
  vendor: VendorResponse | null;
}

function VendorHomeOverview({
  vendor,
  subscriptionTier,
  onNavigate,
}: {
  vendor: VendorResponse | null;
  subscriptionTier: SubscriptionTier;
  onNavigate: (tab: VendorTab) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">{getGreeting()}</p>
          <p className="text-lg font-semibold">{vendor?.businessName ?? '—'}</p>
          <div className="mt-1">
            <SubscriptionBadge tier={subscriptionTier} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { tab: 'bookings' as VendorTab, label: 'Bookings', icon: CalendarCheck },
            { tab: 'listings' as VendorTab, label: 'Listings', icon: Store },
            { tab: 'profile' as VendorTab, label: 'Profile', icon: Building2 },
            { tab: 'plan' as VendorTab, label: 'Plan', icon: Wallet },
          ] as const
        ).map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-200 bg-white p-4 text-center active:bg-surface-50"
          >
            <Icon className="h-6 w-6 text-primary-600" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {vendor && vendor.profileCompleteScore < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complete your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-surface-600">
              Your profile is {vendor.profileCompleteScore}% complete. A complete profile gets more
              enquiries.
            </p>
            <div className="h-2 w-full rounded-full bg-surface-100">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all"
                style={{ width: `${vendor.profileCompleteScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const NAV_ITEMS: { tab: VendorTab; label: string; icon: React.ElementType }[] = [
  { tab: 'home', label: 'Home', icon: LayoutDashboard },
  { tab: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { tab: 'listings', label: 'Listings', icon: Store },
  { tab: 'profile', label: 'Profile', icon: Building2 },
  { tab: 'plan', label: 'Plan', icon: Wallet },
];

export function VendorDashboard({ user, vendor }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<VendorTab>('home');
  const vendorId = user.vendorId!;
  const subscriptionTier = (vendor?.subscriptionTier as SubscriptionTier) ?? SubscriptionTier.FREE;

  return (
    <div className="relative">
      <div className="px-4 pb-20">
        {activeTab === 'home' && (
          <VendorHomeOverview
            vendor={vendor}
            subscriptionTier={subscriptionTier}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'bookings' && (
          <div className="py-4">
            <BookingsManager vendorId={vendorId} />
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="py-4">
            <ListingsPage />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="py-4">
            <Tabs defaultValue="details" className="mb-4">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1">
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex-1">
                  Branding
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <ProfileEditForm vendorId={vendorId} />
              </TabsContent>
              <TabsContent value="portfolio">
                <PortfolioManager vendorId={vendorId} />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsManager vendorId={vendorId} />
              </TabsContent>
              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Branding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InvoiceBrandingSettings
                      vendorId={vendorId}
                      subscriptionTier={subscriptionTier}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="py-4">
            <Tabs defaultValue="enquiries" className="mb-4">
              <TabsList className="w-full">
                <TabsTrigger value="enquiries" className="flex-1">
                  Enquiries
                </TabsTrigger>
                <TabsTrigger value="budget" className="flex-1">
                  Budget
                </TabsTrigger>
                <TabsTrigger value="guests" className="flex-1">
                  Guests
                </TabsTrigger>
              </TabsList>
              <TabsContent value="enquiries">
                <EnquiriesManager />
              </TabsContent>
              <TabsContent value="budget">
                <BudgetManager />
              </TabsContent>
              <TabsContent value="guests">
                <GuestManager />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-surface-200 bg-white">
        <div className="flex h-full">
          {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5',
                activeTab === tab ? 'text-primary-700' : 'text-surface-400',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
