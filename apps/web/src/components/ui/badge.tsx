import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        // General purpose
        default:     'border-transparent bg-primary-100 text-primary-800',
        secondary:   'border-transparent bg-surface-100 text-surface-700',
        destructive: 'border-transparent bg-red-100 text-red-800',
        outline:     'border-surface-200 text-surface-700',
        warning:     'border-transparent bg-celebration-100 text-celebration-800',
        // Listing / category types
        service:     'border-transparent bg-primary-100 text-primary-700',
        rental:      'border-transparent bg-celebration-100 text-celebration-700',
        // Verified vendor badge
        verified:    'border-transparent bg-verified-light text-verified-text',
        // Vendor status machine — maps directly to VendorStatus enum values
        draft:      'border-surface-200 bg-surface-50 text-surface-600',
        pending:    'border-celebration-200 bg-celebration-100 text-celebration-700',
        active:     'border-primary-200 bg-primary-100 text-primary-700',
        changes_requested: 'border-orange-200 bg-orange-100 text-orange-700',
        suspended:  'border-red-200 bg-red-100 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
