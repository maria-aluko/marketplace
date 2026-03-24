'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarCheck,
  Store,
  Building2,
  Wallet,
  CheckCircle2,
  Circle,
  ExternalLink,
  Star,
  MessageSquare,
  BarChart2,
} from 'lucide-react';
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
import { ListingsManager } from '@/components/dashboard/listings-manager';
import { cn, getGreeting } from '@/lib/utils';
import { SubscriptionTier, VendorStatus } from '@eventtrust/shared';
import type { AuthUser, VendorResponse } from '@eventtrust/shared';

type VendorTab = 'home' | 'bookings' | 'listings' | 'profile' | 'plan';

interface VendorDashboardProps {
  user: AuthUser;
  vendor: VendorResponse | null;
}

// --- Status-specific sub-components ---

function ProfileCompletenessChecklist({ vendor }: { vendor: VendorResponse }) {
  const checks = [
    { label: 'Business description', done: !!vendor.description?.trim() },
    { label: 'WhatsApp number', done: !!vendor.whatsappNumber },
    { label: 'Cover image', done: !!vendor.coverImageUrl },
    { label: 'Price range set', done: vendor.priceFrom != null },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">What to complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            {done ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 flex-shrink-0 text-surface-300" />
            )}
            <span className={done ? 'text-surface-400 line-through' : 'text-surface-700'}>
              {label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VendorQuickStats({ vendor }: { vendor: VendorResponse }) {
  const stats = [
    {
      label: 'Avg Rating',
      value: vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : '—',
      icon: Star,
    },
    {
      label: 'Reviews',
      value: vendor.reviewCount.toString(),
      icon: MessageSquare,
    },
    {
      label: 'Profile',
      value: `${vendor.profileCompleteScore}%`,
      icon: BarChart2,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex flex-col items-center py-3 px-2 text-center">
            <Icon className="mb-1 h-4 w-4 text-primary-600" />
            <p className="text-lg font-bold text-surface-900">{value}</p>
            <p className="text-[10px] text-surface-500">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusContent({
  vendor,
  onNavigate,
}: {
  vendor: VendorResponse;
  onNavigate: (tab: VendorTab) => void;
}) {
  const status = vendor.status as VendorStatus;

  if (status === VendorStatus.DRAFT) {
    return (
      <div className="space-y-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium text-amber-800">Profile not submitted yet</p>
            <p className="mt-1 text-xs text-amber-700">
              Complete your profile and submit for review to go live.
            </p>
          </CardContent>
        </Card>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-surface-500">
            <span>Profile completion</span>
            <span>{vendor.profileCompleteScore}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-100">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all"
              style={{ width: `${vendor.profileCompleteScore}%` }}
            />
          </div>
        </div>
        <ProfileCompletenessChecklist vendor={vendor} />
        <button
          onClick={() => onNavigate('profile')}
          className="w-full rounded-xl border border-primary-200 bg-primary-50 py-3 text-sm font-medium text-primary-700 active:bg-primary-100"
        >
          Complete Profile →
        </button>
      </div>
    );
  }

  if (status === VendorStatus.PENDING) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4 px-4">
          <p className="text-sm font-medium text-blue-800">Your profile is under review</p>
          <p className="mt-1 text-xs text-blue-700">
            Our team reviews profiles within 1–3 business days. We'll send you an SMS when the
            review is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === VendorStatus.ACTIVE) {
    return (
      <div className="space-y-4">
        <VendorQuickStats vendor={vendor} />
        <Link
          href={`/vendors/${vendor.slug}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white py-3 text-sm font-medium text-primary-600 active:bg-surface-50"
        >
          View My Profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (status === VendorStatus.CHANGES_REQUESTED) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-4 px-4">
          <p className="text-sm font-medium text-orange-800">Changes requested</p>
          <p className="mt-1 text-xs text-orange-700">
            Our team has reviewed your profile and requested some changes. Go to your Profile tab to
            see the details and resubmit.
          </p>
          <button
            onClick={() => onNavigate('profile')}
            className="mt-3 text-xs font-medium text-orange-800 underline"
          >
            Go to Profile →
          </button>
        </CardContent>
      </Card>
    );
  }

  if (status === VendorStatus.SUSPENDED) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4 px-4">
          <p className="text-sm font-medium text-red-800">Account suspended</p>
          <p className="mt-1 text-xs text-red-700">
            Your account has been suspended. Please contact support for assistance.
          </p>
          <a
            href="mailto:support@eventtrust.com.ng"
            className="mt-3 block text-xs font-medium text-red-800 underline"
          >
            Contact support
          </a>
        </CardContent>
      </Card>
    );
  }

  return null;
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
        </div>
        <div>
          <p className="text-sm text-surface-500">Your plan</p>
          <SubscriptionBadge tier={subscriptionTier} />
        </div>
      </div>

      {vendor && <StatusContent vendor={vendor} onNavigate={onNavigate} />}

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
            <ListingsManager vendorId={vendorId} />
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
