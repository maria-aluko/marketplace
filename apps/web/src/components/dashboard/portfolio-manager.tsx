'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PortfolioItem } from '@eventtrust/shared';
import { PORTFOLIO_MAX_IMAGES, PORTFOLIO_MAX_VIDEOS, MediaType } from '@eventtrust/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { PortfolioUploader } from './portfolio-uploader';

interface PortfolioManagerProps {
  vendorId: string;
}

export function PortfolioManager({ vendorId }: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const imageCount = items.filter((i) => i.mediaType === MediaType.IMAGE).length;
  const videoCount = items.filter((i) => i.mediaType === MediaType.VIDEO).length;

  const loadItems = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.get<{ data: PortfolioItem[] }>(`/vendors/${vendorId}/portfolio`);
    if (result.success && result.data) {
      const data =
        (result.data as unknown as { data: PortfolioItem[] }).data ??
        (result.data as unknown as PortfolioItem[]);
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await apiClient.delete(`/vendors/${vendorId}/portfolio/${deleteTarget.id}`);
    setDeleting(false);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Portfolio</CardTitle>
        <p className="text-sm text-gray-500">
          These images and items will appear on your public profile. These are not the same as
          listing photos, which are attached to specific service or rental listings.
        </p>
        <p className="text-sm text-gray-500">
          {imageCount} / {PORTFOLIO_MAX_IMAGES} images, {videoCount} / {PORTFOLIO_MAX_VIDEOS} videos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading portfolio...</p>
        ) : (
          <>
            {items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                  >
                    <img
                      src={
                        item.mediaType === MediaType.VIDEO
                          ? item.mediaUrl.replace(/\.[^.]+$/, '.jpg')
                          : item.mediaUrl
                      }
                      alt={item.caption || 'Portfolio item'}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="absolute right-1 top-1 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Delete ${item.caption || 'portfolio item'}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                        <p className="text-xs text-white line-clamp-1">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <PortfolioUploader
              vendorId={vendorId}
              remainingImages={PORTFOLIO_MAX_IMAGES - imageCount}
              remainingVideos={PORTFOLIO_MAX_VIDEOS - videoCount}
              onUploadComplete={loadItems}
            />
          </>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
