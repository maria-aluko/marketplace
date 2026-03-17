'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReviewResponse } from '@eventtrust/shared';
import { createVendorReplySchema, VENDOR_REPLY_EDIT_WINDOW_HOURS, DISPUTE_RAISE_WINDOW_HOURS, DISPUTE_APPEAL_WINDOW_HOURS } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { DisputeForm } from './dispute-form';

interface ReviewsManagerProps {
  vendorId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isWithinEditWindow(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const windowMs = VENDOR_REPLY_EDIT_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - created < windowMs;
}

function isWithinDisputeWindow(updatedAt: string): boolean {
  const updated = new Date(updatedAt).getTime();
  const windowMs = DISPUTE_RAISE_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - updated < windowMs;
}

function isWithinAppealWindow(updatedAt: string): boolean {
  const updated = new Date(updatedAt).getTime();
  const windowMs = DISPUTE_APPEAL_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - updated < windowMs;
}

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Dispute: Open',
  decided: 'Dispute: Decided',
  appealed: 'Dispute: Under Appeal',
  closed: 'Dispute: Closed',
};

export function ReviewsManager({ vendorId }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [disputingReview, setDisputingReview] = useState<string | null>(null);
  const [appealingDispute, setAppealingDispute] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.get<{ data: ReviewResponse[] }>(`/vendors/${vendorId}/reviews`);
    if (result.success && result.data) {
      const data = (result.data as unknown as { data: ReviewResponse[] }).data ?? result.data as unknown as ReviewResponse[];
      setReviews(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReply = async (reviewId: string) => {
    setReplyError(null);
    const validation = createVendorReplySchema.safeParse({ body: replyBody });
    if (!validation.success) {
      setReplyError(validation.error.issues[0]?.message || 'Invalid reply');
      return;
    }

    setSubmitting(true);
    const result = await apiClient.post(`/reviews/${reviewId}/reply`, { body: replyBody });
    setSubmitting(false);

    if (result.success) {
      setReplyingTo(null);
      setReplyBody('');
      loadReviews();
    } else {
      setReplyError(result.error || 'Failed to submit reply');
    }
  };

  const handleEditReply = async (reviewId: string) => {
    setReplyError(null);
    const validation = createVendorReplySchema.safeParse({ body: replyBody });
    if (!validation.success) {
      setReplyError(validation.error.issues[0]?.message || 'Invalid reply');
      return;
    }

    setSubmitting(true);
    const result = await apiClient.patch(`/reviews/${reviewId}/reply`, { body: replyBody });
    setSubmitting(false);

    if (result.success) {
      setEditingReply(null);
      setReplyBody('');
      loadReviews();
    } else {
      setReplyError(result.error || 'Failed to update reply');
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-surface-500">Loading reviews...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-sm text-surface-500">No reviews yet.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => {
              const canReply = !review.reply;
              const canEdit = review.reply && isWithinEditWindow(review.reply.createdAt);
              const editExpired = review.reply && !isWithinEditWindow(review.reply.createdAt);
              const canDispute =
                review.status === 'approved' &&
                !review.dispute &&
                isWithinDisputeWindow(review.updatedAt);
              const canAppeal =
                review.dispute?.status === 'decided' &&
                isWithinAppealWindow(review.dispute.updatedAt);

              return (
                <div key={review.id} className="border-b border-surface-100 pb-6 last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-surface-500">{formatDate(review.createdAt)}</span>
                    {review.dispute && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {DISPUTE_STATUS_LABELS[review.dispute.status] ?? 'Dispute'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-surface-700">{review.body}</p>

                  {/* Existing reply */}
                  {review.reply && editingReply !== review.id && (
                    <div className="mt-3 ml-4 border-l-2 border-surface-200 pl-4">
                      <p className="text-xs font-medium text-surface-500">Your reply</p>
                      <p className="mt-1 text-sm text-surface-600">{review.reply.body}</p>
                      <span className="text-xs text-surface-400">{formatDate(review.reply.createdAt)}</span>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            setEditingReply(review.id);
                            setReplyBody(review.reply!.body);
                            setReplyError(null);
                          }}
                        >
                          Edit Reply
                        </Button>
                      )}
                      {editExpired && (
                        <span className="ml-2 text-xs text-surface-400">Edit window expired</span>
                      )}
                    </div>
                  )}

                  {/* Reply form (new) */}
                  {canReply && replyingTo === review.id && (
                    <div className="mt-3 ml-4 space-y-2">
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your reply (min 10 characters)"
                        rows={3}
                      />
                      {replyError && <p className="text-xs text-red-600">{replyError}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReply(review.id)} disabled={submitting}>
                          {submitting ? 'Sending...' : 'Send Reply'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyBody(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Edit reply form */}
                  {editingReply === review.id && (
                    <div className="mt-3 ml-4 space-y-2">
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Edit your reply"
                        rows={3}
                      />
                      {replyError && <p className="text-xs text-red-600">{replyError}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditReply(review.id)} disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save Edit'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingReply(null); setReplyBody(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reply button */}
                  {canReply && replyingTo !== review.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setReplyingTo(review.id);
                        setReplyBody('');
                        setReplyError(null);
                      }}
                    >
                      Reply
                    </Button>
                  )}

                  {/* File Dispute button */}
                  {canDispute && disputingReview !== review.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 ml-1 text-amber-600 hover:text-amber-700"
                      onClick={() => setDisputingReview(review.id)}
                    >
                      File Dispute
                    </Button>
                  )}

                  {/* Dispute form */}
                  {disputingReview === review.id && (
                    <div className="mt-3">
                      <DisputeForm
                        reviewId={review.id}
                        onSuccess={() => { setDisputingReview(null); loadReviews(); }}
                        onCancel={() => setDisputingReview(null)}
                      />
                    </div>
                  )}

                  {/* Appeal button */}
                  {canAppeal && appealingDispute !== review.dispute!.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 ml-1 text-blue-600 hover:text-blue-700"
                      onClick={() => setAppealingDispute(review.dispute!.id)}
                    >
                      Appeal Decision
                    </Button>
                  )}

                  {/* Appeal form */}
                  {review.dispute && appealingDispute === review.dispute.id && (
                    <div className="mt-3">
                      <DisputeForm
                        disputeId={review.dispute.id}
                        isAppeal
                        onSuccess={() => { setAppealingDispute(null); loadReviews(); }}
                        onCancel={() => setAppealingDispute(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
