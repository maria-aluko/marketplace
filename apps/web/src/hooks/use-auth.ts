'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthContext } from '@/lib/auth-context';
import type { AuthUser, OtpRequestResponse } from '@eventtrust/shared';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, logout, refreshUser } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestOtp = async (phone: string): Promise<OtpRequestResponse | null> => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.post<OtpRequestResponse>('/auth/otp/request', { phone });
      if (!res.success) {
        setError(res.error || 'Failed to send OTP');
        return null;
      }
      return res.data!;
    } catch {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<AuthUser | null> => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.post<{ user: AuthUser }>('/auth/otp/verify', { phone, code });
      if (!res.success) {
        setError(res.error || 'Invalid OTP');
        return null;
      }
      setUser(res.data!.user);
      return res.data!.user;
    } catch {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    submitting,
    requestOtp,
    verifyOtp,
    logout,
    refreshUser,
    clearError: () => setError(null),
  };
}
