'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { StarRating } from '@/components/ui/star-rating';
import type { ReviewResponse, PaginatedResponse } from '@eventtrust/shared';

type ActionType = 'reject' | 'remove';

export function ReviewsQueue() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<{ id: string; type: ActionType } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/admin/reviews/pending?cursor=${cursor}&limit=20`
      : '/admin/reviews/pending?limit=20';
    const res = await apiClient.get<{ data: PaginatedResponse<ReviewResponse> }>(url);
    if (!res.success || !res.data) {
      setError('Failed to load reviews');
      return null;
    }
    return res.data.data;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReviews().then((data) => {
      if (data) {
        setReviews(data.data);
        setTotal(data.total);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    });
  }, [fetchReviews]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    const data = await fetchReviews(nextCursor);
    if (data) {
      setReviews((prev) => [...prev, ...data.data]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const res = await apiClient.post(`/admin/reviews/${id}/approve`, {});
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } else {
      setError('Failed to approve review');
    }
    setActionLoading(null);
  };

  const handleRejectOrRemove = async (id: string, type: ActionType) => {
    if (!reasonText.trim()) return;
    setActionLoading(id);
    const res = await apiClient.post(`/admin/reviews/${id}/${type}`, { reason: reasonText });
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
      setExpandedAction(null);
      setReasonText('');
    } else {
      setError(`Failed to ${type} review`);
    }
    setActionLoading(null);
  };

  const toggleExpanded = (id: string, type: ActionType) => {
    if (expandedAction?.id === id && expandedAction.type === type) {
      setExpandedAction(null);
      setReasonText('');
    } else {
      setExpandedAction({ id, type });
      setReasonText('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <p className="text-surface-500">Loading pending reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-surface-500">
        {total} pending review{total !== 1 ? 's' : ''}
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
          <p className="text-surface-500">No pending reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    {review.isVerified && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-surface-700">{review.body}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">
                    <span>Vendor: {review.vendorId}</span>
                    <span>Client: {review.clientId}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleApprove(review.id)}
                  disabled={actionLoading === review.id}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === review.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  onClick={() => toggleExpanded(review.id, 'reject')}
                  disabled={actionLoading === review.id}
                  className="rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => toggleExpanded(review.id, 'remove')}
                  disabled={actionLoading === review.id}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              {expandedAction?.id === review.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder={`Reason for ${expandedAction.type}...`}
                    rows={2}
                    className="w-full rounded-md border border-surface-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectOrRemove(review.id, expandedAction.type)}
                      disabled={!reasonText.trim() || actionLoading === review.id}
                      className="rounded-md bg-surface-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-surface-700 disabled:opacity-50"
                    >
                      {actionLoading === review.id
                        ? 'Working...'
                        : `Confirm ${expandedAction.type}`}
                    </button>
                    <button
                      onClick={() => {
                        setExpandedAction(null);
                        setReasonText('');
                      }}
                      className="rounded-md border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-md border border-surface-200 px-6 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
