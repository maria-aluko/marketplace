'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createReviewSchema, REVIEW_MIN_BODY_LENGTH } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';

interface ReviewFormProps {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

export function ReviewForm({ vendorId, vendorName, vendorSlug }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const result = createReviewSchema.safeParse({ vendorId, rating, body });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() || 'form';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const response = await apiClient.post('/reviews', { vendorId, rating, body });
    setSubmitting(false);

    if (!response.success) {
      setApiError(response.error || 'Failed to submit review');
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-lg font-medium text-surface-900">Thank you for your review!</p>
        <p className="mt-1 text-sm text-surface-500">
          Your review of {vendorName} has been submitted and is pending approval.
        </p>
        <Link href={`/vendors/${vendorSlug}`}>
          <Button variant="outline" className="mt-4">
            Back to {vendorName}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Rating</Label>
        <div className="mt-1">
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      <div>
        <Label htmlFor="review-body">Your Review</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Share your experience with ${vendorName} (minimum ${REVIEW_MIN_BODY_LENGTH} characters)`}
          rows={5}
          className="mt-1"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-surface-400">
            {body.length} / {REVIEW_MIN_BODY_LENGTH} min characters
          </p>
          {errors.body && (
            <p className="text-sm text-red-600">{errors.body}</p>
          )}
        </div>
      </div>

      {apiError && (
        <p className="text-sm text-red-600">{apiError}</p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
