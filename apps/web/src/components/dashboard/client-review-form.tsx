'use client';

import { useState } from 'react';
import { createClientReviewSchema } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';

interface ClientReviewFormProps {
  clientId: string;
  invoiceId: string;
  clientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientReviewForm({ clientId, invoiceId, clientName, onSuccess, onCancel }: ClientReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = createClientReviewSchema.safeParse({ clientId, invoiceId, rating, body: body || undefined });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setSubmitting(true);
    const response = await apiClient.post('/client-reviews', { clientId, invoiceId, rating, body: body || undefined });
    setSubmitting(false);

    if (!response.success) {
      setError(response.error || 'Failed to submit rating');
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-surface-200 p-4">
      <p className="text-sm font-medium text-surface-700">Rate {clientName}</p>

      <div>
        <Label>Rating</Label>
        <div className="mt-1">
          <StarRating value={rating} onChange={setRating} size="sm" />
        </div>
      </div>

      <div>
        <Label htmlFor="client-review-body">Note (optional)</Label>
        <Textarea
          id="client-review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a short note about working with this client (max 200 characters)"
          maxLength={200}
          rows={3}
          className="mt-1"
        />
        <p className="mt-0.5 text-xs text-surface-400">{body.length} / 200</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
