'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { SubscriptionTier } from '@eventtrust/shared';
import type { InvoiceBrandingResponse, SignedUploadResponse } from '@eventtrust/shared';
import { Lock, Upload, Trash2 } from 'lucide-react';

interface InvoiceBrandingSettingsProps {
  vendorId: string;
  subscriptionTier: SubscriptionTier;
}

const BRANDING_TIERS = [SubscriptionTier.PRO, SubscriptionTier.PRO_PLUS];

export function InvoiceBrandingSettings({ vendorId, subscriptionTier }: InvoiceBrandingSettingsProps) {
  const isPro = BRANDING_TIERS.includes(subscriptionTier);

  const [branding, setBranding] = useState<InvoiceBrandingResponse | null>(null);
  const [accentColor, setAccentColor] = useState('#16a34a');
  const [tagline, setTagline] = useState('');
  const [footerText, setFooterText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPro) return;
    apiClient.get<{ data: InvoiceBrandingResponse | null }>(`/vendors/${vendorId}/invoice-branding`)
      .then((res) => {
        if (res.success && res.data) {
          const b = (res.data as any).data;
          if (b) {
            setBranding(b);
            setAccentColor(b.accentColor ?? '#16a34a');
            setTagline(b.tagline ?? '');
            setFooterText(b.footerText ?? '');
          }
        }
      });
  }, [vendorId, isPro]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await apiClient.put<{ data: InvoiceBrandingResponse }>(
      `/vendors/${vendorId}/invoice-branding`,
      {
        accentColor: accentColor || undefined,
        tagline: tagline || undefined,
        footerText: footerText || undefined,
      },
    );

    setSaving(false);

    if (!res.success) {
      setError(res.error ?? 'Failed to save branding');
      return;
    }

    setBranding((res.data as any)?.data ?? null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleLogoFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo must be under 5MB');
      return;
    }

    setLogoUploading(true);
    setLogoError(null);
    setLogoProgress(0);

    // Step 1: Get signed upload URL
    const signRes = await apiClient.post<{ data: SignedUploadResponse }>(
      `/vendors/${vendorId}/invoice-branding/logo-url`,
    );

    if (!signRes.success || !signRes.data) {
      setLogoError('Failed to get upload URL');
      setLogoUploading(false);
      return;
    }

    const signData = (signRes.data as any).data as SignedUploadResponse;

    // Step 2: Upload to Cloudinary
    try {
      const logoUrl = await new Promise<string>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signData.signature);
        formData.append('timestamp', String(signData.timestamp));
        formData.append('api_key', signData.apiKey);
        formData.append('folder', signData.folder);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setLogoProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`);
        xhr.send(formData);
      });

      // Step 3: Confirm upload
      const confirmRes = await apiClient.post<{ data: InvoiceBrandingResponse }>(
        `/vendors/${vendorId}/invoice-branding/logo`,
        { logoUrl },
      );

      if (confirmRes.success) {
        const updated = (confirmRes.data as any)?.data;
        if (updated) setBranding(updated);
      } else {
        setLogoError('Failed to confirm upload');
      }
    } catch {
      setLogoError('Upload failed');
    } finally {
      setLogoUploading(false);
      setLogoProgress(0);
    }
  };

  const handleDeleteLogo = async () => {
    const res = await apiClient.delete(`/vendors/${vendorId}/invoice-branding/logo`);
    if (res.success) {
      setBranding((prev) => prev ? { ...prev, logoUrl: undefined } : null);
    }
  };

  if (!isPro) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center space-y-3">
        <div className="flex justify-center">
          <Lock className="h-8 w-8 text-surface-400" />
        </div>
        <h3 className="font-semibold text-surface-800">Custom Invoice Branding</h3>
        <p className="text-sm text-surface-500">
          Add your logo, brand colour, tagline and footer to every invoice you send.
          Available on Pro and Pro Plus plans.
        </p>
        <p className="text-sm text-surface-500">
          Contact us to upgrade your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-surface-900 mb-4">Invoice Branding</h3>

        {/* Logo section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-surface-700">Logo</label>
          {branding?.logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={branding.logoUrl} alt="Logo" className="h-12 object-contain rounded border border-surface-200 p-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteLogo}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-300 px-4 py-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-surface-400 mb-1" />
              <p className="text-sm text-surface-600">Click to upload logo</p>
              <p className="text-xs text-surface-400">JPG, PNG, WebP — max 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoFile(file);
            }}
          />
          {logoUploading && (
            <div className="text-xs text-surface-500">Uploading... {logoProgress}%</div>
          )}
          {logoError && <p className="text-xs text-red-500">{logoError}</p>}
        </div>
      </div>

      {/* Accent colour */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-surface-700">Accent Colour</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-9 w-16 rounded cursor-pointer border border-surface-300"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#16a34a"
            className="w-32 rounded-md border border-surface-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none"
          />
        </div>
        <p className="text-xs text-surface-400">Used on the Confirm Booking button</p>
      </div>

      {/* Tagline */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-surface-700">Tagline <span className="text-surface-400">(optional)</span></label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={100}
          placeholder="e.g. Making your day unforgettable"
          className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <p className="text-xs text-surface-400">{tagline.length}/100</p>
      </div>

      {/* Footer text */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-surface-700">Footer Text <span className="text-surface-400">(optional)</span></label>
        <textarea
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="e.g. Thank you for choosing us. Payment terms: 50% deposit."
          className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
        <p className="text-xs text-surface-400">{footerText.length}/200</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Branding saved!</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Branding'}
      </Button>
    </div>
  );
}
