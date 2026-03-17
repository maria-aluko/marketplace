'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { StarRating } from '@/components/ui/star-rating';
import type { ClientReviewResponse } from '@eventtrust/shared';

export function ClientReviewsQueue() {
  const [reviews, setReviews] = useState<ClientReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ data: ClientReviewResponse[] }>('/admin/client-reviews/pending').then((res) => {
      if (res.success && res.data) {
        setReviews(res.data.data);
      } else {
        setError('Failed to load client reviews');
      }
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const res = await apiClient.post(`/admin/client-reviews/${id}/approve`, {});
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      setError('Failed to approve review');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <p className="text-surface-500">Loading pending client reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-surface-500">
        {reviews.length} pending client review{reviews.length !== 1 ? 's' : ''}
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-surface-200 bg-surface-50 px-6 py-12 text-center">
          <p className="text-surface-500">No pending client reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <StarRating value={review.rating} readonly size="sm" />
              </div>
              {review.body && (
                <p className="mb-3 text-sm text-surface-700">{review.body}</p>
              )}
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">
                <span>Vendor: {review.vendorId}</span>
                <span>Client: {review.clientId}</span>
                <span>{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <button
                onClick={() => handleApprove(review.id)}
                disabled={actionLoading === review.id}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === review.id ? 'Working...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
