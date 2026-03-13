'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import { isImageUrl } from '@/lib/utils';
import { cloudinaryTransform } from '@/lib/cloudinary';

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
}

export function PhotoCarousel({ photos, alt }: PhotoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (photos.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photos.map((photo, i) =>
          isImageUrl(photo) ? (
            <div key={i} className="w-full flex-shrink-0 snap-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryTransform(photo, 600, 400)}
                alt={`${alt} ${i + 1}`}
                className="aspect-[3/2] w-full rounded-lg object-cover bg-gray-100"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ) : (
            <div
              key={i}
              className="flex w-full flex-shrink-0 snap-center items-center justify-center aspect-[3/2] rounded-lg bg-gray-100"
            >
              <ImageOff className="h-8 w-8 text-gray-300" />
            </div>
          ),
        )}
      </div>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => {
                scrollRef.current?.scrollTo({
                  left: i * (scrollRef.current?.clientWidth ?? 0),
                  behavior: 'smooth',
                });
              }}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === activeIndex ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
