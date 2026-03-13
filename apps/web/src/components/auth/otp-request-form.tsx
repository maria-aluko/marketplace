'use client';

import { useState } from 'react';
import { phoneSchema } from '@eventtrust/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

interface OtpRequestFormProps {
  onSuccess: (phone: string) => void;
}

export function OtpRequestForm({ onSuccess }: OtpRequestFormProps) {
  const [localNumber, setLocalNumber] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { requestOtp, error, submitting } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLocalNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const fullPhone = `+234${localNumber}`;
    const result = phoneSchema.safeParse(fullPhone);
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message ?? 'Invalid phone number');
      return;
    }

    const otpResult = await requestOtp(fullPhone);
    if (otpResult) {
      onSuccess(fullPhone);
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-surface-300 bg-surface-100 px-3 text-sm text-surface-600">
            +234
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="8012345678"
            value={localNumber}
            onChange={handleChange}
            disabled={submitting}
            className="rounded-l-none"
          />
        </div>
        {displayError && <p className="text-sm text-red-600">{displayError}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send OTP'}
      </Button>
    </form>
  );
}
