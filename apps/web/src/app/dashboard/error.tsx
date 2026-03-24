'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-surface-900">Dashboard error</h2>
          <p className="mt-2 text-sm text-surface-500">
            Your data could not be loaded. Try refreshing the page.
          </p>
          <Button onClick={reset} className="mt-6">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
