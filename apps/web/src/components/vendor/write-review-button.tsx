'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface WriteReviewButtonProps {
  vendorId: string;
}

export function WriteReviewButton({ vendorId }: WriteReviewButtonProps) {
  const { user, isAuthenticated } = useAuth();

  // Only hide the button when viewing own vendor profile
  if (user?.vendorId === vendorId) return null;

  if (!isAuthenticated) {
    return (
      <Link href={`/login?redirect=/reviews/new/${vendorId}`}>
        <Button variant="outline" size="sm" className="mt-3">
          Sign in to Write a Review
        </Button>
      </Link>
    );
  }

  return (
    <Link href={`/reviews/new/${vendorId}`}>
      <Button variant="outline" size="sm" className="mt-3">
        Write a Review
      </Button>
    </Link>
  );
}
