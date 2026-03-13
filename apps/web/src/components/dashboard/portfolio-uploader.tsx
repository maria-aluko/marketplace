'use client';

import { useRef, useState } from 'react';
import type { SignedUploadResponse } from '@eventtrust/shared';
import { MediaType } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';

interface PortfolioUploaderProps {
  vendorId: string;
  remainingImages: number;
  remainingVideos: number;
  onUploadComplete: () => void;
}

interface UploadItem {
  file: File;
  caption: string;
  progress: number;
  status: 'pending' | 'uploading' | 'confirming' | 'done' | 'error';
  error?: string;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function getMediaType(file: File): MediaType | null {
  if (IMAGE_TYPES.includes(file.type)) return MediaType.IMAGE;
  if (VIDEO_TYPES.includes(file.type)) return MediaType.VIDEO;
  return null;
}

export function PortfolioUploader({
  vendorId,
  remainingImages,
  remainingVideos,
  onUploadComplete,
}: PortfolioUploaderProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const valid: File[] = [];
    let newImages = 0;
    let newVideos = 0;

    for (const file of files) {
      const mediaType = getMediaType(file);
      if (!mediaType) {
        setError(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (mediaType === MediaType.IMAGE) {
        if (file.size > MAX_IMAGE_SIZE) {
          setError(`Image too large: ${file.name} (max 10MB)`);
          continue;
        }
        if (remainingImages - newImages <= 0) {
          setError('Image limit reached');
          continue;
        }
        newImages++;
      } else {
        if (file.size > MAX_VIDEO_SIZE) {
          setError(`Video too large: ${file.name} (max 100MB)`);
          continue;
        }
        if (remainingVideos - newVideos <= 0) {
          setError('Video limit reached');
          continue;
        }
        newVideos++;
      }
      valid.push(file);
    }
    return valid;
  };

  const uploadFile = async (index: number) => {
    const item = uploads[index];
    if (!item || item.status !== 'pending') return;

    const mediaType = getMediaType(item.file)!;

    // Step 1: Get signed upload URL
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, status: 'uploading' as const } : u)),
    );

    const signResult = await apiClient.post<SignedUploadResponse>(
      `/vendors/${vendorId}/portfolio/upload-url`,
    );
    if (!signResult.success || !signResult.data) {
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'error' as const, error: 'Failed to get upload URL' } : u,
        ),
      );
      return;
    }

    const signData = (signResult.data as unknown as { data: SignedUploadResponse }).data ?? signResult.data as unknown as SignedUploadResponse;

    // Step 2: Upload to Cloudinary via XMLHttpRequest for progress
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
              setUploads((prev) =>
                prev.map((u, i) => (i === index ? { ...u, progress: pct } : u)),
              );
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
          xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`,
          );
          xhr.send(formData);
        },
      );

      // Step 3: Confirm upload with backend
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: 'confirming' as const, progress: 100 } : u)),
      );

      const confirmResult = await apiClient.post(
        `/vendors/${vendorId}/portfolio/confirm`,
        {
          publicId,
          mediaUrl,
          mediaType,
          caption: item.caption || undefined,
        },
      );

      if (confirmResult.success) {
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, status: 'done' as const } : u)),
        );
      } else {
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'error' as const, error: 'Failed to confirm upload' } : u,
          ),
        );
      }
    } catch {
      setUploads((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'error' as const, error: 'Upload failed' } : u,
        ),
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = validateFiles(Array.from(files));
    if (valid.length === 0) return;

    const newUploads: UploadItem[] = valid.map((file) => ({
      file,
      caption: '',
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const startUploads = async () => {
    const pendingIndices = uploads
      .map((u, i) => (u.status === 'pending' ? i : -1))
      .filter((i) => i >= 0);

    for (const idx of pendingIndices) {
      await uploadFile(idx);
    }
    onUploadComplete();
    setUploads((prev) => prev.filter((u) => u.status !== 'done'));
  };

  const hasPending = uploads.some((u) => u.status === 'pending');
  const hasActive = uploads.some((u) => u.status === 'uploading' || u.status === 'confirming');

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-300 px-6 py-8 text-center hover:border-primary-400 transition-colors"
      >
        <Upload className="h-8 w-8 text-surface-400 mb-2" />
        <p className="text-sm text-surface-600">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-surface-400">
          Images (JPG, PNG, WebP, max 10MB) or Videos (MP4, max 100MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-label="Upload files"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload, index) => (
            <div key={index} className="rounded-md border border-surface-200 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-surface-700 truncate">{upload.file.name}</p>
                <span className="text-xs text-surface-500">{upload.status}</span>
              </div>
              {upload.status === 'pending' && (
                <Input
                  placeholder="Caption (optional)"
                  value={upload.caption}
                  onChange={(e) =>
                    setUploads((prev) =>
                      prev.map((u, i) => (i === index ? { ...u, caption: e.target.value } : u)),
                    )
                  }
                  className="mt-2"
                />
              )}
              {(upload.status === 'uploading' || upload.status === 'confirming') && (
                <Progress value={upload.progress} className="mt-2 h-2" />
              )}
              {upload.error && (
                <p className="mt-1 text-xs text-red-600">{upload.error}</p>
              )}
            </div>
          ))}

          {hasPending && !hasActive && (
            <Button onClick={startUploads} size="sm">
              Upload {uploads.filter((u) => u.status === 'pending').length} file(s)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
