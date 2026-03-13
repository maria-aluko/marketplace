'use client';

import { useRef, useState } from 'react';
import type { SignedUploadResponse } from '@eventtrust/shared';
import { LISTING_MAX_PHOTOS } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';
import { cloudinaryTransform } from '@/lib/cloudinary';

interface ListingPhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  publicId?: string;
  mediaUrl?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function ListingPhotoUploader({ photos, onChange, disabled }: ListingPhotoUploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingCount = uploads.filter(
    (u) => u.status === 'pending' || u.status === 'uploading',
  ).length;
  const remaining = LISTING_MAX_PHOTOS - photos.length - pendingCount;

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const valid: File[] = [];
    let count = 0;
    const availableSlots = LISTING_MAX_PHOTOS - photos.length - pendingCount;

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`Unsupported file type: ${file.name}. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image too large: ${file.name} (max 10MB)`);
        continue;
      }
      if (availableSlots - count <= 0) {
        setError(`Maximum of ${LISTING_MAX_PHOTOS} photos per listing`);
        break;
      }
      count++;
      valid.push(file);
    }
    return valid;
  };

  const uploadFile = async (index: number, items: UploadItem[]): Promise<UploadItem> => {
    const item = items[index];
    if (!item || item.status !== 'pending') return item!;

    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, status: 'uploading' as const } : u)),
    );

    // Get signed upload URL
    const signResult = await apiClient.post<SignedUploadResponse>('/listings/upload-url');
    if (!signResult.success || !signResult.data) {
      const failed = { ...item, status: 'error' as const, error: 'Failed to get upload URL' };
      setUploads((prev) => prev.map((u, i) => (i === index ? failed : u)));
      return failed;
    }

    const signData =
      (signResult.data as unknown as { data: SignedUploadResponse }).data ??
      (signResult.data as unknown as SignedUploadResponse);

    try {
      const { publicId, mediaUrl } = await new Promise<{ publicId: string; mediaUrl: string }>(
        (resolve, reject) => {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('signature', signData.signature);
          formData.append('timestamp', String(signData.timestamp));
          formData.append('api_key', signData.apiKey);
          formData.append('folder', signData.folder);

          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, progress: pct } : u)));
            }
          });
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              resolve({ publicId: data.public_id, mediaUrl: data.secure_url });
            } else {
              reject(new Error('Upload failed'));
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`);
          xhr.send(formData);
        },
      );

      const done = {
        ...item,
        status: 'done' as const,
        progress: 100,
        publicId,
        mediaUrl,
      };
      setUploads((prev) => prev.map((u, i) => (i === index ? done : u)));
      return done;
    } catch {
      const failed = { ...item, status: 'error' as const, error: 'Upload failed' };
      setUploads((prev) => prev.map((u, i) => (i === index ? failed : u)));
      return failed;
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = validateFiles(Array.from(files));
    if (valid.length === 0) return;

    const newUploads: UploadItem[] = valid.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const startUploads = async () => {
    const currentUploads = [...uploads];
    const newUrls: string[] = [];

    for (let i = 0; i < currentUploads.length; i++) {
      const upload = currentUploads[i];
      if (upload && upload.status === 'pending') {
        const result = await uploadFile(i, currentUploads);
        if (result.status === 'done' && result.mediaUrl) {
          newUrls.push(result.mediaUrl);
        }
      }
    }

    if (newUrls.length > 0) {
      onChange([...photos, ...newUrls]);
    }

    // Clear completed uploads
    setUploads((prev) => prev.filter((u) => u.status !== 'done'));
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const hasPending = uploads.some((u) => u.status === 'pending');
  const hasActive = uploads.some((u) => u.status === 'uploading');

  return (
    <div className="space-y-3">
      {/* Already uploaded photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photoUrl, index) => (
            <div
              key={photoUrl}
              className="group relative aspect-square rounded-md overflow-hidden border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryTransform(photoUrl, 200, 200)}
                alt={`Listing ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center hover:border-primary-400 transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-400 mb-1" />
          <p className="text-sm text-gray-600">
            Drag photos here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            JPG, PNG, WebP — max 10MB each — {remaining} remaining
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            aria-label="Upload listing photos"
            disabled={disabled}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{upload.file.name}</p>
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="mt-1 h-1.5" />
                )}
                {upload.error && <p className="mt-0.5 text-xs text-red-600">{upload.error}</p>}
              </div>
              {upload.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => removeUpload(index)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Remove from queue"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {upload.status === 'uploading' && (
                <span className="text-xs text-gray-500">{upload.progress}%</span>
              )}
            </div>
          ))}

          {hasPending && !hasActive && (
            <Button type="button" onClick={startUploads} size="sm" disabled={disabled}>
              Upload {uploads.filter((u) => u.status === 'pending').length} photo(s)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
