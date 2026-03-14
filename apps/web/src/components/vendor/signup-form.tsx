'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  VendorCategory,
  LAGOS_AREAS,
  CATEGORY_LABELS,
  createVendorSchema,
} from '@eventtrust/shared';
import type { CreateVendorPayload } from '@eventtrust/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UtensilsCrossed,
  Camera,
  Video,
  Building2,
  Palette,
  Mic2,
  Music,
  Sparkles,
  CalendarCheck,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STEPS = ['Business Info', 'Details', 'Contact', 'Review'];
const categories = Object.values(VendorCategory);

const CATEGORY_ICONS: Record<VendorCategory, LucideIcon> = {
  [VendorCategory.CATERER]: UtensilsCrossed,
  [VendorCategory.PHOTOGRAPHER]: Camera,
  [VendorCategory.VIDEOGRAPHER]: Video,
  [VendorCategory.VENUE]: Building2,
  [VendorCategory.DECORATOR]: Palette,
  [VendorCategory.MC]: Mic2,
  [VendorCategory.DJ]: Music,
  [VendorCategory.MAKEUP_ARTIST]: Sparkles,
  [VendorCategory.PLANNER]: CalendarCheck,
  [VendorCategory.OTHER]: MoreHorizontal,
};

const STORAGE_KEY = 'eventtrust_vendor_signup_draft';
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const initialFormData: CreateVendorPayload = {
  businessName: '',
  category: VendorCategory.CATERER,
  description: '',
  area: LAGOS_AREAS[0],
};

function loadDraft(): { step: number; formData: CreateVendorPayload } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { step: parsed.step ?? 0, formData: { ...initialFormData, ...parsed.formData } };
  } catch {
    return null;
  }
}

export function VendorSignupForm() {
  const draft = typeof window !== 'undefined' ? loadDraft() : null;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [formData, setFormData] = useState<CreateVendorPayload>(draft?.formData ?? initialFormData);
  const [showDraftBanner, setShowDraftBanner] = useState(!!draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  // Persist draft to localStorage on step/formData changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, formData, savedAt: Date.now() }));
    } catch {
      // Storage full or unavailable — ignore
    }
  }, [step, formData]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setStep(0);
    setFormData(initialFormData);
    setShowDraftBanner(false);
  };

  const update = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.businessName || formData.businessName.length < 2) {
        stepErrors.businessName = 'Business name must be at least 2 characters';
      }
      if (!formData.category) stepErrors.category = 'Select a category';
      if (!formData.area) stepErrors.area = 'Select an area';
    } else if (step === 1) {
      if (!formData.description || formData.description.length < 20) {
        stepErrors.description = 'Description must be at least 20 characters';
      }
      if (
        formData.priceFrom !== undefined &&
        formData.priceTo !== undefined &&
        formData.priceFrom > formData.priceTo
      ) {
        stepErrors.priceTo = 'Max price must be greater than min price';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const result = createVendorSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path.join('.')] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await apiClient.post<{ data: { id: string } }>('/vendors', formData);
      if (!createRes.success) {
        setSubmitError(createRes.error || 'Failed to create vendor');
        return;
      }

      const vendorId = createRes.data!.data.id;
      await apiClient.post(`/vendors/${vendorId}/submit`);
      clearDraft();
      router.push('/dashboard');
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft restored banner */}
      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <span>We restored your previous progress.</span>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="font-medium underline hover:text-blue-900"
          >
            Start over
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className="ml-1.5 hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Business Info */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => update('businessName', e.target.value)}
              placeholder="e.g. Lagos Catering Co"
            />
            {errors.businessName && <p className="text-sm text-red-600">{errors.businessName}</p>}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const isSelected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update('category', cat)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{CATEGORY_LABELS[cat] ?? cat}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area in Lagos</Label>
            <Select value={formData.area} onValueChange={(v) => update('area', v)}>
              <SelectTrigger id="area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {LAGOS_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.area && <p className="text-sm text-red-600">{errors.area}</p>}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder="Tell potential clients about your business..."
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priceFrom">Min Price (NGN)</Label>
              <Input
                id="priceFrom"
                type="number"
                value={formData.priceFrom ?? ''}
                onChange={(e) =>
                  update('priceFrom', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceTo">Max Price (NGN)</Label>
              <Input
                id="priceTo"
                type="number"
                value={formData.priceTo ?? ''}
                onChange={(e) =>
                  update('priceTo', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="500000"
              />
              {errors.priceTo && <p className="text-sm text-red-600">{errors.priceTo}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              value={formData.address ?? ''}
              onChange={(e) => update('address', e.target.value || undefined)}
              placeholder="123 Main St, Lekki"
            />
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number (optional)</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              value={formData.whatsappNumber ?? ''}
              onChange={(e) => update('whatsappNumber', e.target.value || undefined)}
              placeholder="+234XXXXXXXXXX"
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-600">{errors.whatsappNumber}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Instagram Handle (optional)</Label>
            <Input
              id="instagramHandle"
              value={formData.instagramHandle ?? ''}
              onChange={(e) => update('instagramHandle', e.target.value || undefined)}
              placeholder="@yourbusiness"
            />
            {errors.instagramHandle && (
              <p className="text-sm text-red-600">{errors.instagramHandle}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <div className="space-y-3 text-sm">
          <h3 className="font-medium text-gray-900">Review your listing</h3>
          <dl className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-500">Business Name</dt>
              <dd className="font-medium">{formData.businessName}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-500">Category</dt>
              <dd className="font-medium">
                {CATEGORY_LABELS[formData.category] ?? formData.category}
              </dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-gray-500">Area</dt>
              <dd className="font-medium">{formData.area}</dd>
            </div>
            <div className="border-b pb-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="mt-1">{formData.description}</dd>
            </div>
            {formData.priceFrom && (
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Price Range</dt>
                <dd className="font-medium">
                  NGN {formData.priceFrom?.toLocaleString('en-NG')} -{' '}
                  {formData.priceTo?.toLocaleString('en-NG')}
                </dd>
              </div>
            )}
            {formData.whatsappNumber && (
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">WhatsApp</dt>
                <dd className="font-medium">{formData.whatsappNumber}</dd>
              </div>
            )}
            {formData.instagramHandle && (
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Instagram</dt>
                <dd className="font-medium">{formData.instagramHandle}</dd>
              </div>
            )}
          </dl>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        )}
      </div>
    </div>
  );
}
