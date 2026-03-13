import {
  UtensilsCrossed,
  Camera,
  Video,
  Building,
  Sparkles,
  Mic,
  Music,
  Palette,
  CalendarCheck,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { VendorCategory } from '@eventtrust/shared';

export const CATEGORY_ICONS: Record<VendorCategory, LucideIcon> = {
  [VendorCategory.CATERER]: UtensilsCrossed,
  [VendorCategory.PHOTOGRAPHER]: Camera,
  [VendorCategory.VIDEOGRAPHER]: Video,
  [VendorCategory.VENUE]: Building,
  [VendorCategory.DECORATOR]: Sparkles,
  [VendorCategory.MC]: Mic,
  [VendorCategory.DJ]: Music,
  [VendorCategory.MAKEUP_ARTIST]: Palette,
  [VendorCategory.PLANNER]: CalendarCheck,
  [VendorCategory.OTHER]: MoreHorizontal,
};
