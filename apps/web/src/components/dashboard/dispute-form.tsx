'use client';

import { useState } from 'react';
import { createDisputeSchema, disputeAppealSchema } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DisputeFormProps {
  reviewId?: string;
  disputeId?: string;
  isAppeal?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DisputeForm({ reviewId, disputeId, isAppeal = false, onSuccess, onCancel }: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = isAppeal ? disputeAppealSchema : createDisputeSchema;
  const minLength = 20;
  const label = isAppeal ? 'Appeal Reason' : 'Dispute Reason';
  const placeholder = isAppeal
    ? 'Explain why you are appealing this decision (min 20 characters)'
    : 'Explain why you are disputing this review (min 20 characters)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = isAppeal ? { reason } : { reviewId: reviewId!, reason };
    const validation = schema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setSubmitting(true);

    const url = isAppeal ? `/disputes/${disputeId}/appeal` : '/disputes';
    const response = await apiClient.post(url, payload);
    setSubmitting(false);

    if (!response.success) {
      setError(response.error || 'Submission failed');
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-surface-200 p-4">
      <div>
        <Label htmlFor="dispute-reason">{label}</Label>
        <Textarea
          id="dispute-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-surface-400">{reason.length} / {minLength} min characters</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Submitting...' : isAppeal ? 'Submit Appeal' : 'File Dispute'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
