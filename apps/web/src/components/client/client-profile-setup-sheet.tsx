'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { OtpRequestForm } from '@/components/auth/otp-request-form';
import { OtpVerifyForm } from '@/components/auth/otp-verify-form';
import type { ClientProfileResponse } from '@eventtrust/shared';

interface ClientProfileSetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClientProfileSetupSheet({ open, onOpenChange, onSuccess }: ClientProfileSetupSheetProps) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('profile');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(user ? 'profile' : 'phone');
      setPhone('');
      setDisplayName('');
      setEmail('');
      setError(null);
    }
  }, [open]); // intentionally omit `user` — snapshot at open time

  const titles: Record<'phone' | 'otp' | 'profile', string> = {
    phone: 'Contact Vendor',
    otp: 'Verify Your Number',
    profile: 'Quick Setup',
  };

  const descriptions: Partial<Record<'phone' | 'otp' | 'profile', string>> = {
    phone: 'Enter your phone number to continue.',
    profile: 'Add your name so vendors know who is contacting them.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (displayName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post<{ data: ClientProfileResponse }>('/clients/profile', {
        displayName: displayName.trim(),
        ...(email.trim() && { email: email.trim() }),
      });

      if (!res.success) {
        setError(res.error || 'Failed to save profile');
        return;
      }

      await refreshUser();
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 top-auto fixed translate-y-0 rounded-t-2xl rounded-b-none max-w-full sm:max-w-md sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{titles[step]}</DialogTitle>
          {descriptions[step] && (
            <p className="text-sm text-surface-500">{descriptions[step]}</p>
          )}
        </DialogHeader>

        <div className="pt-2">
          {step === 'phone' && (
            <OtpRequestForm
              onSuccess={(phone) => { setPhone(phone); setStep('otp'); }}
            />
          )}

          {step === 'otp' && (
            <OtpVerifyForm
              phone={phone}
              onBack={() => setStep('phone')}
              onSuccess={(user) => {
                if (user.clientProfileId) {
                  onSuccess();
                } else {
                  setStep('profile');
                }
              }}
            />
          )}

          {step === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Your Name *</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Amara Johnson"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting || displayName.trim().length < 2}>
                  {submitting ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
