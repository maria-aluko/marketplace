import { VendorCategory, RentalCategory, DeliveryOption } from '../enums';

// Human-readable category labels for display
export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  [VendorCategory.CATERER]: 'Catering',
  [VendorCategory.PHOTOGRAPHER]: 'Photography',
  [VendorCategory.VIDEOGRAPHER]: 'Videography',
  [VendorCategory.VENUE]: 'Venues',
  [VendorCategory.DECORATOR]: 'Decoration',
  [VendorCategory.MC]: 'MC / Host',
  [VendorCategory.DJ]: 'DJ',
  [VendorCategory.MAKEUP_ARTIST]: 'Makeup Artist',
  [VendorCategory.PLANNER]: 'Event Planning',
  [VendorCategory.OTHER]: 'Other Services',
};

// Human-readable rental category labels for display
export const RENTAL_CATEGORY_LABELS: Record<RentalCategory, string> = {
  [RentalCategory.TENT]: 'Tents',
  [RentalCategory.CHAIRS_TABLES]: 'Chairs & Tables',
  [RentalCategory.COOKING_EQUIPMENT]: 'Cooking Equipment',
  [RentalCategory.GENERATOR]: 'Generators',
  [RentalCategory.LIGHTING]: 'Lighting',
  [RentalCategory.OTHER_RENTAL]: 'Other Equipment',
};

// Human-readable delivery option labels for display
export const DELIVERY_OPTION_LABELS: Record<DeliveryOption, string> = {
  [DeliveryOption.PICKUP_ONLY]: 'Pickup Only',
  [DeliveryOption.DELIVERY_ONLY]: 'Delivery Only',
  [DeliveryOption.BOTH]: 'Pickup & Delivery',
};

// Ranking weights (must sum to 1.0)
export const RANKING_WEIGHTS = {
  AVG_RATING: 0.5,
  REVIEW_COUNT: 0.3,
  PROFILE_COMPLETENESS: 0.1,
  RECENCY: 0.1,
} as const;

export const MAX_REVIEW_COUNT_FOR_RANKING = 50;

// Business rule limits
export const OTP_MAX_REQUESTS_PER_10_MIN = 3;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;

export const REVIEW_MIN_BODY_LENGTH = 50;
export const REVIEW_MAX_PER_VENDOR_PER_YEAR = 1;

export const VENDOR_REPLY_EDIT_WINDOW_HOURS = 48;
export const DISPUTE_RAISE_WINDOW_HOURS = 72;
export const DISPUTE_APPEAL_WINDOW_HOURS = 48;
export const DISPUTE_MAX_APPEALS = 1;

export const PORTFOLIO_MAX_IMAGES = 10;
export const PORTFOLIO_MAX_VIDEOS = 2;

// JWT
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Lagos areas (for search/filter)
export const LAGOS_AREAS = [
  'Ikeja',
  'Victoria Island',
  'Lekki',
  'Surulere',
  'Yaba',
  'Ikoyi',
  'Ajah',
  'Festac',
  'Ogba',
  'Maryland',
  'Gbagada',
  'Magodo',
  'Ikorodu',
  'Oshodi',
  'Mushin',
  'Apapa',
  'Amuwo-Odofin',
  'Alimosho',
  'Agege',
  'Badagry',
  'Epe',
  'Ibeju-Lekki',
] as const;

export type LagosArea = (typeof LAGOS_AREAS)[number];

// Cookie & CSRF names
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

// OTP backoff
export const OTP_BACKOFF_BASE_MS = 1000;

// Slug
export const SLUG_MAX_LENGTH = 80;

// Listing limits
export const LISTING_MAX_PHOTOS = 10;
export const FREE_TIER_LISTING_LIMIT = 3;
export const PRO_TIER_LISTING_LIMIT = 10;
export const PRO_PLUS_TIER_LISTING_LIMIT = 25;
export const LISTING_TITLE_MIN_LENGTH = 5;
export const LISTING_TITLE_MAX_LENGTH = 120;
export const LISTING_DESCRIPTION_MIN_LENGTH = 20;
export const LISTING_DESCRIPTION_MAX_LENGTH = 3000;

// Vendor status transitions
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending'],
  pending: ['active', 'changes_requested'],
  changes_requested: ['pending'],
  active: ['suspended'],
  suspended: ['active'],
} as const;
