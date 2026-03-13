'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRentalListingSchema, RentalCategory, DeliveryOption } from '@eventtrust/shared';
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

const RENTAL_CATEGORIES = Object.values(RentalCategory);
const DELIVERY_OPTIONS = Object.values(DeliveryOption);

export function RentalListingForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rentalCategory: '' as string,
    quantityAvailable: '',
    pricePerDay: '',
    depositAmount: '',
    deliveryOption: '' as string,
    condition: '',
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
      pricePerDay: parseInt(formData.pricePerDay, 10) || 0,
      depositAmount: formData.depositAmount ? parseInt(formData.depositAmount, 10) : undefined,
      deliveryOption: formData.deliveryOption,
      condition: formData.condition || undefined,
    };

    const validation = createRentalListingSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message ?? 'Validation failed');
      return;
    }

    setSubmitting(true);
    const res = await apiClient.post('/listings/rental', payload);
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
          <Label htmlFor="pricePerDay">Price Per Day (kobo)</Label>
          <Input
            id="pricePerDay"
            name="pricePerDay"
            type="number"
            min="1"
            value={formData.pricePerDay}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="depositAmount">Deposit Amount (kobo, optional)</Label>
        <Input
          id="depositAmount"
          name="depositAmount"
          type="number"
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Rental Listing'}
      </Button>
    </form>
  );
}
