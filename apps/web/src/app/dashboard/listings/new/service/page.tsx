'use client';

import { ServiceListingForm } from '@/components/listings/service-listing-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewServiceListingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Service Listing</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceListingForm />
        </CardContent>
      </Card>
    </div>
  );
}
