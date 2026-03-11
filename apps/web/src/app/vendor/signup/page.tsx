import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VendorSignupForm } from '@/components/vendor/signup-form';

export default function VendorSignupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>List Your Business</CardTitle>
          <CardDescription>
            Join EventTrust and get discovered by clients looking for event vendors in Lagos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorSignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
