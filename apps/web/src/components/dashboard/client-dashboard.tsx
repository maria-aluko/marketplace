'use client';

import { useState } from 'react';
import { LayoutDashboard, MessageSquare, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BudgetManager } from './budget-manager';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@eventtrust/shared';

type Tab = 'home' | 'enquiries' | 'guests' | 'budget';

interface ClientDashboardProps {
  user: AuthUser;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-medium">{label}</p>
      <p className="text-sm text-surface-500">Coming soon</p>
    </div>
  );
}

function HomeOverview({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate: (tab: Tab) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">Welcome back</p>
          <Badge variant="secondary" className="mt-1">
            ****{user.phone.slice(-4)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { tab: 'enquiries' as Tab, label: 'Enquiries', icon: MessageSquare },
            { tab: 'guests' as Tab, label: 'Guests', icon: Users },
            { tab: 'budget' as Tab, label: 'Budget', icon: Wallet },
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
  { tab: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { tab: 'guests', label: 'Guests', icon: Users },
  { tab: 'budget', label: 'Budget', icon: Wallet },
];

export function ClientDashboard({ user }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="relative">
      <div className="pb-20 px-4">
        {activeTab === 'home' && (
          <HomeOverview user={user} onNavigate={setActiveTab} />
        )}
        {activeTab === 'enquiries' && <ComingSoon label="Enquiries" />}
        {activeTab === 'guests' && <ComingSoon label="Guest List" />}
        {activeTab === 'budget' && <BudgetManager />}
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
