'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const interactive = !readonly && !!onChange;

  return (
    <div className="inline-flex items-center gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          className={cn(
            'focus:outline-none disabled:cursor-default',
            interactive && 'cursor-pointer hover:scale-110 transition-transform',
          )}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300',
            )}
          />
        </button>
      ))}
    </div>
  );
}
