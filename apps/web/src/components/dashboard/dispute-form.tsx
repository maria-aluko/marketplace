'use client';

import { useState } from 'react';
import { createDisputeSchema, disputeAppealSchema, DISPUTE_MAX_EVIDENCE } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Paperclip, X, CheckCircle2, Loader2 } from 'lucide-react';

interface DisputeFormProps {
  reviewId?: string;
  disputeId?: string;
  isAppeal?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface EvidenceUpload {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface SignedUploadResponse {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
}

export function DisputeForm({ reviewId, disputeId, isAppeal = false, onSuccess, onCancel }: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Evidence upload (step 2 — only for new disputes, not appeals)
  const [createdDisputeId, setCreatedDisputeId] = useState<string | null>(disputeId ?? null);
  const [step, setStep] = useState<'form' | 'evidence'>(disputeId ? 'evidence' : 'form');
  const [evidenceUploads, setEvidenceUploads] = useState<EvidenceUpload[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);

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
    const response = await apiClient.post<{ data: { id: string } }>(url, payload);
    setSubmitting(false);

    if (!response.success) {
      setError(response.error || 'Submission failed');
      return;
    }

    if (!isAppeal && response.data) {
      const newId = (response.data as any).data?.id;
      if (newId) {
        setCreatedDisputeId(newId);
        setStep('evidence');
        return;
      }
    }

    onSuccess();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = DISPUTE_MAX_EVIDENCE - evidenceUploads.length;
    const toAdd = files.slice(0, remaining);

    setEvidenceUploads((prev) => [
      ...prev,
      ...toAdd.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        status: 'pending' as const,
      })),
    ]);
    e.target.value = '';
  };

  const removeEvidence = (index: number) => {
    setEvidenceUploads((prev) => {
      URL.revokeObjectURL(prev[index]!.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadEvidence = async () => {
    if (!createdDisputeId) return;
    const pending = evidenceUploads.filter((u) => u.status === 'pending');

    for (let i = 0; i < evidenceUploads.length; i++) {
      const item = evidenceUploads[i];
      if (!item || item.status !== 'pending') continue;

      setEvidenceUploads((prev) =>
        prev.map((u, idx) => (idx === i ? { ...u, status: 'uploading' } : u)),
      );

      try {
        // Step 1: get signed URL
        const signRes = await apiClient.post<SignedUploadResponse>(
          `/disputes/${createdDisputeId}/evidence/signed-url`,
        );
        if (!signRes.success || !signRes.data) throw new Error('Could not get upload URL');
        const signData = (signRes.data as any).data ?? signRes.data;

        // Step 2: upload to Cloudinary
        const mediaUrl = await new Promise<string>((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('signature', signData.signature);
          formData.append('timestamp', String(signData.timestamp));
          formData.append('api_key', signData.apiKey);
          formData.append('folder', signData.folder);

          const xhr = new XMLHttpRequest();
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText).secure_url);
            } else {
              reject(new Error('Upload failed'));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`);
          xhr.send(formData);
        });

        // Step 3: confirm with backend
        const confirmRes = await apiClient.post(`/disputes/${createdDisputeId}/evidence`, {
          url: mediaUrl,
        });
        if (!confirmRes.success) throw new Error('Failed to save evidence');

        setEvidenceUploads((prev) =>
          prev.map((u, idx) => (idx === i ? { ...u, status: 'done' } : u)),
        );
      } catch (err: any) {
        setEvidenceUploads((prev) =>
          prev.map((u, idx) =>
            idx === i ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u,
          ),
        );
      }
    }
  };

  const handleFinish = async () => {
    const hasPending = evidenceUploads.some((u) => u.status === 'pending');
    if (hasPending) {
      await uploadEvidence();
    }
    onSuccess();
  };

  // Step 2: Evidence upload screen (shown after dispute is created)
  if (step === 'evidence' && !isAppeal) {
    const allDone = evidenceUploads.every((u) => u.status === 'done');
    const anyUploading = evidenceUploads.some((u) => u.status === 'uploading');
    const canAddMore = evidenceUploads.length < DISPUTE_MAX_EVIDENCE;

    return (
      <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Dispute submitted successfully</p>
            <p className="mt-0.5 text-xs text-green-700">
              Add up to {DISPUTE_MAX_EVIDENCE} evidence files to strengthen your case (optional).
            </p>
          </div>
        </div>

        {evidenceUploads.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {evidenceUploads.map((u, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-surface-200 bg-white">
                <img src={u.preview} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                {u.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
                {u.status === 'done' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
                {u.status === 'error' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600 px-1 py-0.5">
                    <p className="truncate text-[9px] text-white">{u.error}</p>
                  </div>
                )}
                {u.status !== 'uploading' && (
                  <button
                    onClick={() => removeEvidence(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canAddMore && (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-surface-700 hover:text-surface-900">
            <Paperclip className="h-3.5 w-3.5" />
            Add evidence file
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleFileSelect}
            />
          </label>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleFinish}
            disabled={anyUploading}
          >
            {anyUploading ? 'Uploading...' : 'Done'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onSuccess}>
            Skip
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Dispute form
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
