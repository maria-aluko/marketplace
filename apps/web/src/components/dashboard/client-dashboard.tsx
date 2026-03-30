'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, LayoutDashboard, Search, Wrench, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { BudgetManager } from './budget-manager';
import { GuestManager } from './guest-manager';
import { ActivityManager } from './activity-manager';
import { apiClient } from '@/lib/api-client';
import { cn, getGreeting } from '@/lib/utils';
import type { AuthUser, InquiryResponse } from '@eventtrust/shared';
import { InquiryStatus } from '@eventtrust/shared';
import { ClientProfileSetupSheet } from '@/components/client/client-profile-setup-sheet';

type Tab = 'home' | 'bookings' | 'tools';

interface ClientDashboardProps {
  user: AuthUser;
}

const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  [InquiryStatus.NEW]: 'New',
  [InquiryStatus.CONTACTED]: 'Contacted',
  [InquiryStatus.BOOKED]: 'Booked',
  [InquiryStatus.COMPLETED]: 'Done',
  [InquiryStatus.CANCELLED]: 'Cancelled',
};

const INQUIRY_STATUS_CLASS: Record<InquiryStatus, string> = {
  [InquiryStatus.NEW]: 'bg-surface-100 text-surface-600',
  [InquiryStatus.CONTACTED]: 'bg-blue-100 text-blue-700',
  [InquiryStatus.BOOKED]: 'bg-primary-100 text-primary-700',
  [InquiryStatus.COMPLETED]: 'bg-primary-50 text-primary-600',
  [InquiryStatus.CANCELLED]: 'bg-surface-100 text-surface-400',
};

function OnboardingGuide({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const steps = [
    { num: '1', text: 'Browse vendors or equipment that match your event needs' },
    { num: '2', text: 'Tap "Contact on WhatsApp" on any listing to enquire' },
    { num: '3', text: 'Vendor sends you a quote — come back here to confirm your booking' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-200 bg-white p-4">
        <p className="text-sm font-semibold text-surface-800 mb-3">How EventTrust works</p>
        <div className="space-y-3">
          {steps.map(({ num, text }) => (
            <div key={num} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {num}
              </span>
              <p className="text-sm text-surface-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/services">
          <Button className="w-full" size="sm">
            <Search className="h-4 w-4 mr-1.5" />
            Find Vendors
          </Button>
        </Link>
        <Link href="/equipment">
          <Button variant="outline" className="w-full" size="sm">
            Rent Equipment
          </Button>
        </Link>
      </div>
    </div>
  );
}

function RecentActivitySummary({
  inquiries,
  onViewAll,
}: {
  inquiries: InquiryResponse[];
  onViewAll: () => void;
}) {
  if (inquiries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            View all →
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-surface-50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-800">
                {inq.listingTitle ?? inq.vendorName ?? 'Enquiry'}
              </p>
              {inq.vendorName && inq.listingTitle && (
                <p className="truncate text-xs text-surface-500">{inq.vendorName}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${INQUIRY_STATUS_CLASS[inq.status as InquiryStatus] ?? 'bg-surface-100 text-surface-600'}`}
            >
              {INQUIRY_STATUS_LABEL[inq.status as InquiryStatus] ?? inq.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HomeOverview({
  user,
  recentInquiries,
  onNavigate,
  onOpenProfileSheet,
}: {
  user: AuthUser;
  recentInquiries: InquiryResponse[];
  onNavigate: (tab: Tab) => void;
  onOpenProfileSheet: () => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-md">{getGreeting()}</p>
      </div>

      {!user.clientProfileId && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Add your name</p>
            <p className="text-xs text-amber-700">So vendors know who is contacting them.</p>
          </div>
          <button
            onClick={onOpenProfileSheet}
            className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {recentInquiries.length > 0 ? (
        <RecentActivitySummary
          inquiries={recentInquiries}
          onViewAll={() => onNavigate('bookings')}
        />
      ) : (
        <OnboardingGuide onNavigate={onNavigate} />
      )}

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { tab: 'bookings' as Tab, label: 'My Bookings', icon: CalendarCheck },
            { tab: 'tools' as Tab, label: 'Tools', icon: Wrench },
          ] as const
        ).map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-200 bg-white p-3 text-center active:bg-surface-50"
          >
            <Icon className="h-5 w-5 text-primary-600" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {recentInquiries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/services">
            <Button variant="outline" className="w-full">
              Discover Vendors
            </Button>
          </Link>
          <Link href="/equipment">
            <Button variant="outline" className="w-full">
              Rent Equipment
            </Button>
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Become a Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-surface-600">
            List your business on EventTrust and get discovered by clients in Lagos.
          </p>
          <Link href="/vendor/signup">
            <Button className="w-full">Create Vendor Profile</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ElementType }[] = [
  { tab: 'home', label: 'Home', icon: LayoutDashboard },
  { tab: 'bookings', label: 'My Bookings', icon: CalendarCheck },
  { tab: 'tools', label: 'Tools', icon: Wrench },
];

export function ClientDashboard({ user }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [recentInquiries, setRecentInquiries] = useState<InquiryResponse[]>([]);

  useEffect(() => {
    apiClient.get<{ data: InquiryResponse[] }>('/inquiries').then((res) => {
      if (res.success && res.data) {
        setRecentInquiries(res.data.data.slice(0, 3));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <div className="pb-20 px-4">
        {activeTab === 'home' && (
          <HomeOverview
            user={user}
            recentInquiries={recentInquiries}
            onNavigate={setActiveTab}
            onOpenProfileSheet={() => setProfileSheetOpen(true)}
          />
        )}
        {activeTab === 'bookings' && <ActivityManager />}
        {activeTab === 'tools' && (
          <div className="py-4">
            <Tabs defaultValue="budget">
              <TabsList className="w-full">
                <TabsTrigger value="budget" className="flex-1">
                  Budget
                </TabsTrigger>
                <TabsTrigger value="guests" className="flex-1">
                  Guests
                </TabsTrigger>
              </TabsList>
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

      <ClientProfileSetupSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        onSuccess={() => setProfileSheetOpen(false)}
      />
    </div>
  );
}
