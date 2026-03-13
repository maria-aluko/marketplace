'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRentalListingSchema,
  updateRentalListingSchema,
  RentalCategory,
  DeliveryOption,
} from '@eventtrust/shared';
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

const RENTAL_CATEGORIES = Object.values(RentalCategory);
const DELIVERY_OPTIONS = Object.values(DeliveryOption);

interface RentalListingFormProps {
  listingId?: string;
  initialData?: {
    title: string;
    description: string;
    rentalCategory: string;
    quantityAvailable: string;
    pricePerDay: string;
    depositAmount: string;
    deliveryOption: string;
    condition: string;
    photos: string[];
  };
}

export function RentalListingForm({ listingId, initialData }: RentalListingFormProps) {
  const isEdit = !!listingId;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    rentalCategory: initialData?.rentalCategory ?? ('' as string),
    quantityAvailable: initialData?.quantityAvailable ?? '',
    pricePerDay: initialData?.pricePerDay ?? '',
    depositAmount: initialData?.depositAmount ?? '',
    deliveryOption: initialData?.deliveryOption ?? ('' as string),
    condition: initialData?.condition ?? '',
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
      rentalCategory: formData.rentalCategory,
      quantityAvailable: parseInt(formData.quantityAvailable, 10) || 0,
      pricePerDay: Math.round(parseFloat(formData.pricePerDay) * 100) || 0,
      depositAmount: formData.depositAmount
        ? Math.round(parseFloat(formData.depositAmount) * 100)
        : undefined,
      deliveryOption: formData.deliveryOption,
      condition: formData.condition || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    const validation = isEdit
      ? updateRentalListingSchema.safeParse(payload)
      : createRentalListingSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message ?? 'Validation failed');
      return;
    }

    setSubmitting(true);
    const res = isEdit
      ? await apiClient.patch(`/listings/${listingId}`, payload)
      : await apiClient.post('/listings/rental', payload);
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
        <Label htmlFor="rentalCategory">Rental Category</Label>
        <Select
          value={formData.rentalCategory}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, rentalCategory: v }))}
          disabled={submitting}
        >
          <SelectTrigger id="rentalCategory">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {RENTAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantityAvailable">Quantity Available</Label>
          <Input
            id="quantityAvailable"
            name="quantityAvailable"
            type="number"
            min="1"
            value={formData.quantityAvailable}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerDay">Price Per Day (₦)</Label>
          <Input
            id="pricePerDay"
            name="pricePerDay"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 5000"
            value={formData.pricePerDay}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="depositAmount">Deposit Amount (₦, optional)</Label>
        <Input
          id="depositAmount"
          name="depositAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 2000"
          value={formData.depositAmount}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryOption">Delivery Option</Label>
        <Select
          value={formData.deliveryOption}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, deliveryOption: v }))}
          disabled={submitting}
        >
          <SelectTrigger id="deliveryOption">
            <SelectValue placeholder="Select delivery option" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition (optional)</Label>
        <Input
          id="condition"
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          disabled={submitting}
        />
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
            : 'Create Rental Listing'}
      </Button>
    </form>
  );
}
