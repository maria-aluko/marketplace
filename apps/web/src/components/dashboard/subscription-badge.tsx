'use client';

import { SubscriptionTier } from '@eventtrust/shared';
import { Badge } from '@/components/ui/badge';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'FREE',
  [SubscriptionTier.PRO]: 'PRO',
  [SubscriptionTier.PRO_PLUS]: 'PRO PLUS',
};

export function SubscriptionBadge({ tier }: SubscriptionBadgeProps) {
  const isPaid = tier === SubscriptionTier.PRO || tier === SubscriptionTier.PRO_PLUS;

  return (
    <Badge variant={isPaid ? 'verified' : 'secondary'} className="text-xs">
      {TIER_LABELS[tier]}
    </Badge>
  );
}
