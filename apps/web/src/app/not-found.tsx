import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
            <span className="text-2xl">?</span>
          </div>
          <h2 className="text-lg font-semibold text-surface-900">Page not found</h2>
          <p className="mt-2 text-sm text-surface-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">Browse Vendors</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
