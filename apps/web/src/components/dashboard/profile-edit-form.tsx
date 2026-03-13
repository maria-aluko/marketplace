'use client';

import { useCallback, useEffect, useState } from 'react';
import { VendorCategory, LAGOS_AREAS, updateVendorSchema, VendorStatus } from '@eventtrust/shared';
import type { VendorResponse } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileEditFormProps {
  vendorId: string;
}

const categories = Object.values(VendorCategory);

const statusVariant: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  pending: 'warning',
  active: 'default',
  changes_requested: 'destructive',
  suspended: 'destructive',
};

export function ProfileEditForm({ vendorId }: ProfileEditFormProps) {
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    category: '' as VendorCategory,
    description: '',
    area: '',
    address: '',
    priceFrom: '',
    priceTo: '',
    whatsappNumber: '',
    instagramHandle: '',
  });

  const loadVendor = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.get<{ data: VendorResponse }>(`/vendors/${vendorId}`);
    if (result.success && result.data) {
      const v = (result.data as unknown as { data: VendorResponse }).data ?? result.data as unknown as VendorResponse;
      setVendor(v);
      setForm({
        businessName: v.businessName,
        category: v.category,
        description: v.description,
        area: v.area,
        address: v.address || '',
        priceFrom: v.priceFrom ? String(v.priceFrom) : '',
        priceTo: v.priceTo ? String(v.priceTo) : '',
        whatsappNumber: v.whatsappNumber || '',
        instagramHandle: v.instagramHandle || '',
      });
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setSuccessMsg(null);

    const payload = {
      businessName: form.businessName,
      category: form.category,
      description: form.description,
      area: form.area,
      address: form.address || undefined,
      priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
      priceTo: form.priceTo ? Number(form.priceTo) : undefined,
      whatsappNumber: form.whatsappNumber || undefined,
      instagramHandle: form.instagramHandle || undefined,
    };

    const validation = updateVendorSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString() || 'form';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    const result = await apiClient.patch(`/vendors/${vendorId}`, payload);
    setSaving(false);

    if (!result.success) {
      setApiError(result.error || 'Failed to update profile');
      return;
    }

    setSuccessMsg('Profile updated successfully');
    loadVendor();
  };

  const handleResubmit = async () => {
    setSaving(true);
    const result = await apiClient.post(`/vendors/${vendorId}/submit`);
    setSaving(false);
    if (result.success) {
      setSuccessMsg('Submitted for review');
      loadVendor();
    } else {
      setApiError(result.error || 'Failed to resubmit');
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Loading profile...</p>;
  }

  if (!vendor) {
    return <p className="py-8 text-center text-red-500">Failed to load vendor profile.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edit Profile</CardTitle>
          <Badge variant={statusVariant[vendor.status] || 'secondary'}>
            {vendor.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        {vendor.status === VendorStatus.CHANGES_REQUESTED && (
          <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              Changes have been requested. Please update your profile and resubmit.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleResubmit}
              disabled={saving}
            >
              Resubmit for Review
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pe-businessName">Business Name</Label>
            <Input
              id="pe-businessName"
              value={form.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
            />
            {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
          </div>

          <div>
            <Label htmlFor="pe-category">Category</Label>
            <select
              id="pe-category"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <Label htmlFor="pe-description">Description</Label>
            <Textarea
              id="pe-description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <Label htmlFor="pe-area">Area in Lagos</Label>
            <select
              id="pe-area"
              value={form.area}
              onChange={(e) => handleChange('area', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <option value="">Select area</option>
              {LAGOS_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area}</p>}
          </div>

          <div>
            <Label htmlFor="pe-address">Address (optional)</Label>
            <Input
              id="pe-address"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pe-priceFrom">Price From</Label>
              <Input
                id="pe-priceFrom"
                type="number"
                value={form.priceFrom}
                onChange={(e) => handleChange('priceFrom', e.target.value)}
              />
              {errors.priceFrom && <p className="mt-1 text-sm text-red-600">{errors.priceFrom}</p>}
            </div>
            <div>
              <Label htmlFor="pe-priceTo">Price To</Label>
              <Input
                id="pe-priceTo"
                type="number"
                value={form.priceTo}
                onChange={(e) => handleChange('priceTo', e.target.value)}
              />
              {errors.priceTo && <p className="mt-1 text-sm text-red-600">{errors.priceTo}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="pe-whatsapp">WhatsApp Number</Label>
            <Input
              id="pe-whatsapp"
              value={form.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              placeholder="+234XXXXXXXXXX"
            />
            {errors.whatsappNumber && <p className="mt-1 text-sm text-red-600">{errors.whatsappNumber}</p>}
          </div>

          <div>
            <Label htmlFor="pe-instagram">Instagram Handle</Label>
            <Input
              id="pe-instagram"
              value={form.instagramHandle}
              onChange={(e) => handleChange('instagramHandle', e.target.value)}
              placeholder="@handle"
            />
            {errors.instagramHandle && <p className="mt-1 text-sm text-red-600">{errors.instagramHandle}</p>}
          </div>

          {apiError && <p className="text-sm text-red-600">{apiError}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
