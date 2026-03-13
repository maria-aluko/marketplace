'use client';

import { useState } from 'react';
import type { PortfolioItem } from '@eventtrust/shared';
import { MediaType } from '@eventtrust/shared';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play } from 'lucide-react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface PortfolioGalleryProps {
  items: PortfolioItem[];
}

export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No portfolio items yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {item.mediaType === MediaType.VIDEO ? (
              <>
                <img
                  src={item.mediaUrl.replace(/\.[^.]+$/, '.jpg')}
                  alt={item.caption || 'Portfolio video'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <img
                src={item.mediaUrl}
                alt={item.caption || 'Portfolio image'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            )}
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <VisuallyHidden.Root>
            <DialogTitle>Portfolio item</DialogTitle>
          </VisuallyHidden.Root>
          {selected && (
            <div>
              {selected.mediaType === MediaType.VIDEO ? (
                <video
                  src={selected.mediaUrl}
                  controls
                  className="w-full"
                  autoPlay
                />
              ) : (
                <img
                  src={selected.mediaUrl}
                  alt={selected.caption || 'Portfolio image'}
                  className="w-full"
                />
              )}
              {selected.caption && (
                <p className="p-4 text-sm text-gray-600">{selected.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
