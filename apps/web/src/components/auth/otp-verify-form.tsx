'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OTP_LENGTH, UserRole } from '@eventtrust/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { AuthUser } from '@eventtrust/shared';

interface OtpVerifyFormProps {
  phone: string;
  onBack: () => void;
  onSuccess?: (user: AuthUser) => void;
}

export function OtpVerifyForm({ phone, onBack, onSuccess }: OtpVerifyFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, requestOtp, error, submitting } = useAuth();

  const fillOtp = useCallback((code: string) => {
    const newDigits = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < Math.min(code.length, OTP_LENGTH); i++) {
      newDigits[i] = code[i] ?? '';
    }
    setDigits(newDigits);
    const focusIndex = Math.min(code.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();

    // Web OTP API: auto-read OTP from SMS on supported browsers (Android Chrome)
    if ('OTPCredential' in window) {
      const ac = new AbortController();
      abortRef.current = ac;
      navigator.credentials
        .get({
          // @ts-expect-error -- Web OTP API types not in all TS libs
          otp: { transport: ['sms'] },
          signal: ac.signal,
        })
        .then((otpCredential: any) => {
          if (otpCredential?.code) {
            fillOtp(otpCredential.code.replace(/\D/g, '').slice(0, OTP_LENGTH));
          }
        })
        .catch(() => {
          // User dismissed or API unsupported — silently ignore
        });
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [fillOtp]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    fillOtp(pasted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) return;

    const user = await verifyOtp(phone, code);
    if (user) {
      if (onSuccess) {
        onSuccess(user);
      } else {
        const raw = searchParams.get('redirect');
        const redirect =
          raw && raw.startsWith('/') && !raw.startsWith('//')
            ? raw
            : user.role?.toLowerCase() === UserRole.ADMIN
              ? '/admin'
              : '/dashboard';
        router.push(redirect);
      }
    }
  };

  const handleResend = async () => {
    await requestOtp(phone);
    setResendTimer(60);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-center text-sm text-surface-600">
        Enter the 6-digit code sent to <strong>{phone}</strong>
      </p>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-12 text-center text-lg"
            disabled={submitting}
          />
        ))}
      </div>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || digits.join('').length !== OTP_LENGTH}
      >
        {submitting ? 'Verifying...' : 'Verify'}
      </Button>

      <div className="space-y-2 text-sm">
        {resendTimer <= 0 && (
          <p className="text-center text-surface-500">
            Didn&apos;t receive the code? Check your SMS inbox
          </p>
        )}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="text-surface-500 hover:text-surface-700">
            Change number
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className="text-primary-600 hover:text-primary-700 disabled:text-surface-400"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </form>
  );
}
