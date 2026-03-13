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
  Tent,
  Armchair,
  CookingPot,
  Zap,
  Lightbulb,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { VendorCategory, RentalCategory } from '@eventtrust/shared';

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

export const RENTAL_CATEGORY_ICONS: Record<RentalCategory, LucideIcon> = {
  [RentalCategory.TENT]: Tent,
  [RentalCategory.CHAIRS_TABLES]: Armchair,
  [RentalCategory.COOKING_EQUIPMENT]: CookingPot,
  [RentalCategory.GENERATOR]: Zap,
  [RentalCategory.LIGHTING]: Lightbulb,
  [RentalCategory.OTHER_RENTAL]: Package,
};
