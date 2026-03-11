'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OtpRequestForm } from '@/components/auth/otp-request-form';
import { OtpVerifyForm } from '@/components/auth/otp-verify-form';

function LoginContent() {
  const [phone, setPhone] = useState<string | null>(null);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            {phone
              ? 'Enter your verification code'
              : 'Enter your phone number to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phone ? (
            <OtpVerifyForm phone={phone} onBack={() => setPhone(null)} />
          ) : (
            <OtpRequestForm onSuccess={setPhone} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
