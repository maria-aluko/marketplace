'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceListingSchema, updateServiceListingSchema } from '@eventtrust/shared';
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
import { ListingPhotoUploader } from './listing-photo-uploader';

const CATEGORIES = Object.values(VendorCategory);

interface ServiceListingFormProps {
  listingId?: string;
  initialData?: {
    title: string;
    description: string;
    category: string;
    priceFrom: string;
    priceTo: string;
    photos: string[];
  };
}

export function ServiceListingForm({ listingId, initialData }: ServiceListingFormProps) {
  const isEdit = !!listingId;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? ('' as string),
    priceFrom: initialData?.priceFrom ?? '',
    priceTo: initialData?.priceTo ?? '',
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
      priceFrom: formData.priceFrom ? Math.round(parseFloat(formData.priceFrom) * 100) : undefined,
      priceTo: formData.priceTo ? Math.round(parseFloat(formData.priceTo) * 100) : undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    const validation = isEdit
      ? updateServiceListingSchema.safeParse(payload)
      : createServiceListingSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message ?? 'Validation failed');
      return;
    }

    setSubmitting(true);
    const res = isEdit
      ? await apiClient.patch(`/listings/${listingId}`, payload)
      : await apiClient.post('/listings/service', payload);
    setSubmitting(false);

    if (res.success) {
      router.push('/dashboard/listings');
    } else {
      setError(res.error || `Failed to ${isEdit ? 'update' : 'create'} listing`);
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
          <Label htmlFor="priceFrom">Price From (₦)</Label>
          <Input
            id="priceFrom"
            name="priceFrom"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 1500"
            value={formData.priceFrom}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceTo">Price To (₦)</Label>
          <Input
            id="priceTo"
            name="priceTo"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 5000"
            value={formData.priceTo}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Photos</Label>
        <ListingPhotoUploader photos={photos} onChange={setPhotos} disabled={submitting} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting
          ? isEdit
            ? 'Saving...'
            : 'Creating...'
          : isEdit
            ? 'Save Changes'
            : 'Create Service Listing'}
      </Button>
    </form>
  );
}
