'use client';

import { useState } from 'react';
import { LayoutDashboard, MessageSquare, Wrench, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { BudgetManager } from './budget-manager';
import { GuestManager } from './guest-manager';
import { ActivityManager } from './activity-manager';
import { cn, getGreeting } from '@/lib/utils';
import type { AuthUser } from '@eventtrust/shared';
import { ClientProfileSetupSheet } from '@/components/client/client-profile-setup-sheet';

type Tab = 'home' | 'activity' | 'tools';

interface ClientDashboardProps {
  user: AuthUser;
}

function HomeOverview({
  user,
  onNavigate,
  onOpenProfileSheet,
}: {
  user: AuthUser;
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

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { tab: 'activity' as Tab, label: 'Activity', icon: MessageSquare },
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
  { tab: 'activity', label: 'Activity', icon: MessageSquare },
  { tab: 'tools', label: 'Tools', icon: Wrench },
];

export function ClientDashboard({ user }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  return (
    <div className="relative">
      <div className="pb-20 px-4">
        {activeTab === 'home' && (
          <HomeOverview
            user={user}
            onNavigate={setActiveTab}
            onOpenProfileSheet={() => setProfileSheetOpen(true)}
          />
        )}
        {activeTab === 'activity' && <ActivityManager />}
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
