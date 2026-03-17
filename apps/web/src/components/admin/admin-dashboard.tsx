'use client';

import { useState } from 'react';
import { ReviewsQueue } from './reviews-queue';
import { ClientReviewsQueue } from './client-reviews-queue';

type Tab = 'reviews' | 'client-reviews';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('reviews');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">Admin — Review Moderation</h1>

      <div className="mb-6 flex space-x-1 border-b border-surface-200">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'reviews'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Vendor Reviews
        </button>
        <button
          onClick={() => setActiveTab('client-reviews')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'client-reviews'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Client Reviews
        </button>
      </div>

      {activeTab === 'reviews' && <ReviewsQueue />}
      {activeTab === 'client-reviews' && <ClientReviewsQueue />}
    </div>
  );
}
