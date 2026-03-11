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
  const [phone, setPhone] = useState('+234');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { requestOtp, error, submitting } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message ?? 'Invalid phone number');
      return;
    }

    const otpResult = await requestOtp(phone);
    if (otpResult) {
      onSuccess(phone);
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+234XXXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
        />
        {displayError && <p className="text-sm text-red-600">{displayError}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send OTP'}
      </Button>
    </form>
  );
}
