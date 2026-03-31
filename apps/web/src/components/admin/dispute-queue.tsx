'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import type { DisputeResponse, PaginatedResponse } from '@eventtrust/shared';

interface DecisionForm {
  decision: string;
  policyClause: string;
  removeReview: boolean;
}

export function DisputeQueue() {
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [decisionForms, setDecisionForms] = useState<Record<string, DecisionForm>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    const res = await apiClient.get<{ data: PaginatedResponse<DisputeResponse> }>(
      '/admin/disputes?limit=50',
    );
    if (res.success && res.data) {
      setDisputes(res.data.data.data);
    } else {
      setError('Failed to load disputes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const getOrInitForm = (id: string): DecisionForm =>
    decisionForms[id] ?? { decision: '', policyClause: '', removeReview: false };

  const updateForm = (id: string, patch: Partial<DecisionForm>) => {
    setDecisionForms((prev) => ({ ...prev, [id]: { ...getOrInitForm(id), ...patch } }));
  };

  const handleDecide = async (disputeId: string) => {
    const form = getOrInitForm(disputeId);
    if (!form.decision.trim() || !form.policyClause.trim()) return;
    setActionLoading(disputeId);
    const res = await apiClient.post(`/admin/disputes/${disputeId}/decide`, {
      decision: form.decision,
      policyClause: form.policyClause,
      removeReview: form.removeReview,
    });
    setActionLoading(null);
    if (res.success) {
      setDisputes((prev) => prev.filter((d) => d.id !== disputeId));
    }
  };

  const handleClose = async (disputeId: string) => {
    setActionLoading(disputeId);
    const res = await apiClient.post(`/admin/disputes/${disputeId}/close`, {});
    setActionLoading(null);
    if (res.success) {
      setDisputes((prev) => prev.filter((d) => d.id !== disputeId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) return <p className="py-4 text-sm text-red-500">{error}</p>;

  if (disputes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-300 py-10 text-center">
        <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-surface-300" />
        <p className="text-sm text-surface-500">No open disputes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {disputes.map((dispute) => {
        const isExpanded = expandedId === dispute.id;
        const form = getOrInitForm(dispute.id);

        return (
          <div key={dispute.id} className="rounded-lg border border-surface-200 bg-white">
            <button
              className="flex w-full items-start justify-between gap-3 p-4 text-left"
              onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      dispute.status === 'open'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {dispute.status.toUpperCase()}
                  </span>
                  <span className="truncate text-sm font-medium text-surface-900">
                    Dispute #{dispute.id.slice(-6)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-surface-600">{dispute.reason}</p>
                {dispute.evidence.length > 0 && (
                  <p className="mt-1 text-xs text-surface-400">
                    {dispute.evidence.length} evidence file{dispute.evidence.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-surface-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-surface-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-surface-100 px-4 pb-4 pt-3">
                {/* Evidence thumbnails */}
                {dispute.evidence.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {dispute.evidence.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-md border border-surface-200"
                      >
                        <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Appeal reason if appealed */}
                {dispute.appealReason && (
                  <div className="mb-3 rounded-md bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">Appeal reason:</p>
                    <p className="mt-1 text-sm text-blue-800">{dispute.appealReason}</p>
                  </div>
                )}

                {dispute.status === 'open' && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-surface-700">
                        Decision *
                      </label>
                      <textarea
                        rows={3}
                        value={form.decision}
                        onChange={(e) => updateForm(dispute.id, { decision: e.target.value })}
                        placeholder="Explain your decision..."
                        className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-surface-700">
                        Policy clause *
                      </label>
                      <input
                        type="text"
                        value={form.policyClause}
                        onChange={(e) => updateForm(dispute.id, { policyClause: e.target.value })}
                        placeholder="e.g. Policy 3.2 — Review Accuracy"
                        className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-700">
                      <input
                        type="checkbox"
                        checked={form.removeReview}
                        onChange={(e) => updateForm(dispute.id, { removeReview: e.target.checked })}
                        className="h-4 w-4 rounded border-surface-300"
                      />
                      Remove the review from the platform
                    </label>
                    <Button
                      size="sm"
                      onClick={() => handleDecide(dispute.id)}
                      disabled={
                        actionLoading === dispute.id ||
                        !form.decision.trim() ||
                        !form.policyClause.trim()
                      }
                    >
                      {actionLoading === dispute.id ? 'Submitting...' : 'Submit Decision'}
                    </Button>
                  </div>
                )}

                {dispute.status === 'appealed' && (
                  <div className="space-y-2">
                    <p className="text-sm text-surface-600">
                      Previous decision: <span className="font-medium">{dispute.adminDecision}</span>
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClose(dispute.id)}
                      disabled={actionLoading === dispute.id}
                    >
                      {actionLoading === dispute.id ? 'Closing...' : 'Close Dispute'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
