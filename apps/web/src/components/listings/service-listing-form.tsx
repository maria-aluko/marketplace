'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceListingSchema } from '@eventtrust/shared';
import { VendorCategory } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = Object.values(VendorCategory);

export function ServiceListingForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as string,
    priceFrom: '',
    priceTo: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priceFrom: formData.priceFrom ? parseInt(formData.priceFrom, 10) : undefined,
      priceTo: formData.priceTo ? parseInt(formData.priceTo, 10) : undefined,
    };

    const validation = createServiceListingSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message ?? 'Validation failed');
      return;
    }

    setSubmitting(true);
    const res = await apiClient.post('/listings/service', payload);
    setSubmitting(false);

    if (res.success) {
      router.push('/dashboard/listings');
    } else {
      setError(res.error || 'Failed to create listing');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          className="min-h-[100px]"
          value={formData.description}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
          disabled={submitting}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceFrom">Price From (kobo)</Label>
          <Input
            id="priceFrom"
            name="priceFrom"
            type="number"
            value={formData.priceFrom}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceTo">Price To (kobo)</Label>
          <Input
            id="priceTo"
            name="priceTo"
            type="number"
            value={formData.priceTo}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Service Listing'}
      </Button>
    </form>
  );
}
