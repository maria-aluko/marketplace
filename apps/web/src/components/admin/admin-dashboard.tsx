'use client';

import { useState } from 'react';
import { ReviewsQueue } from './reviews-queue';
import { ClientReviewsQueue } from './client-reviews-queue';
import { VendorQueue } from './vendor-queue';
import { DisputeQueue } from './dispute-queue';
import { AdminAnalytics } from './admin-analytics';

type Tab = 'reviews' | 'client-reviews' | 'vendors' | 'disputes' | 'analytics';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('vendors');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'vendors', label: 'Vendor Approvals' },
    { id: 'reviews', label: 'Vendor Reviews' },
    { id: 'client-reviews', label: 'Client Reviews' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Admin Dashboard</h1>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-surface-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'vendors' && <VendorQueue />}
      {activeTab === 'reviews' && <ReviewsQueue />}
      {activeTab === 'client-reviews' && <ClientReviewsQueue />}
      {activeTab === 'disputes' && <DisputeQueue />}
      {activeTab === 'analytics' && <AdminAnalytics />}
    </div>
  );
}
