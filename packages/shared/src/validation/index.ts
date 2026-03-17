import { z } from 'zod';
import {
  VendorCategory,
  VendorStatus,
  MediaType,
  RentalCategory,
  DeliveryOption,
  RentalCondition,
  ListingType,
  GuestStatus,
  InquiryStatus,
  InquirySource,
  SubscriptionTier,
} from '../enums';
import {
  REVIEW_MIN_BODY_LENGTH,
  OTP_LENGTH,
  LAGOS_AREAS,
  LISTING_TITLE_MIN_LENGTH,
  LISTING_TITLE_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_MAX_PHOTOS,
} from '../constants';

// Phone: E.164 format for Nigeria
export const phoneSchema = z
  .string()
  .regex(/^\+234[0-9]{10}$/, 'Phone must be in E.164 format: +234XXXXXXXXXX');

// OTP
export const otpRequestSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(OTP_LENGTH, `OTP must be ${OTP_LENGTH} digits`),
});

// Vendor
const vendorBaseSchema = z.object({
  businessName: z.string().min(2).max(100),
  category: z.nativeEnum(VendorCategory),
  description: z.string().min(20).max(2000),
  area: z.string().refine((val) => (LAGOS_AREAS as readonly string[]).includes(val), {
    message: 'Must be a valid Lagos area',
  }),
  address: z.string().max(200).optional(),
  priceFrom: z.number().positive().optional(),
  priceTo: z.number().positive().optional(),
  whatsappNumber: phoneSchema.optional(),
  instagramHandle: z
    .string()
    .regex(/^@?[\w.]{1,30}$/, 'Invalid Instagram handle')
    .optional(),
});

const priceRangeRefinement = <T extends { priceFrom?: number; priceTo?: number }>(data: T) => {
  if (data.priceFrom !== undefined && data.priceTo !== undefined) {
    return data.priceFrom <= data.priceTo;
  }
  return true;
};

export const createVendorSchema = vendorBaseSchema.refine(priceRangeRefinement, {
  message: 'priceFrom must be less than or equal to priceTo',
  path: ['priceTo'],
});

export const updateVendorSchema = vendorBaseSchema.partial().refine(priceRangeRefinement, {
  message: 'priceFrom must be less than or equal to priceTo',
  path: ['priceTo'],
});

// Listing — Service
export const createServiceListingSchema = z
  .object({
    title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH),
    description: z.string().min(LISTING_DESCRIPTION_MIN_LENGTH).max(LISTING_DESCRIPTION_MAX_LENGTH),
    category: z.nativeEnum(VendorCategory),
    priceFrom: z.number().int().nonnegative().optional(),
    priceTo: z.number().int().nonnegative().optional(),
    photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
  })
  .refine(priceRangeRefinement, {
    message: 'priceFrom must be less than or equal to priceTo',
    path: ['priceTo'],
  });

export const updateServiceListingSchema = z
  .object({
    title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH).optional(),
    description: z
      .string()
      .min(LISTING_DESCRIPTION_MIN_LENGTH)
      .max(LISTING_DESCRIPTION_MAX_LENGTH)
      .optional(),
    category: z.nativeEnum(VendorCategory).optional(),
    priceFrom: z.number().int().nonnegative().optional(),
    priceTo: z.number().int().nonnegative().optional(),
    photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
  })
  .refine(priceRangeRefinement, {
    message: 'priceFrom must be less than or equal to priceTo',
    path: ['priceTo'],
  });

// Listing — Rental
export const createRentalListingSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH),
  description: z.string().min(LISTING_DESCRIPTION_MIN_LENGTH).max(LISTING_DESCRIPTION_MAX_LENGTH),
  rentalCategory: z.nativeEnum(RentalCategory),
  quantityAvailable: z.number().int().positive(),
  pricePerDay: z.number().int().positive(),
  depositAmount: z.number().int().nonnegative().optional(),
  deliveryOption: z.nativeEnum(DeliveryOption),
  condition: z.nativeEnum(RentalCondition).optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
});

export const updateRentalListingSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH).optional(),
  description: z
    .string()
    .min(LISTING_DESCRIPTION_MIN_LENGTH)
    .max(LISTING_DESCRIPTION_MAX_LENGTH)
    .optional(),
  rentalCategory: z.nativeEnum(RentalCategory).optional(),
  quantityAvailable: z.number().int().positive().optional(),
  pricePerDay: z.number().int().positive().optional(),
  depositAmount: z.number().int().nonnegative().optional(),
  deliveryOption: z.nativeEnum(DeliveryOption).optional(),
  condition: z.nativeEnum(RentalCondition).optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
});

// Review
export const createReviewSchema = z.object({
  vendorId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(REVIEW_MIN_BODY_LENGTH).max(2000),
});

export const createVendorReplySchema = z.object({
  body: z.string().min(10).max(1000),
});

// Client reviews (vendor → client)
export const createClientReviewSchema = z.object({
  clientId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(200).optional(),
});

// Dispute
export const createDisputeSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().min(20).max(2000),
});

export const disputeDecisionSchema = z.object({
  decision: z.string().min(10).max(2000),
  policyClause: z.string().min(5).max(500),
  removeReview: z.boolean(),
});

export const disputeAppealSchema = z.object({
  reason: z.string().min(20).max(2000),
});

// Search — Vendors
export const searchVendorsSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.nativeEnum(VendorCategory).optional(),
  area: z.string().optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  rentalCategory: z.nativeEnum(RentalCategory).optional(),
  verifiedOnly: z.coerce.boolean().optional().default(false),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// Search — Listings
export const searchListingsSchema = z
  .object({
    q: z.string().max(100).optional(),
    listingType: z.nativeEnum(ListingType).optional(),
    category: z.nativeEnum(VendorCategory).optional(),
    rentalCategory: z.nativeEnum(RentalCategory).optional(),
    area: z.string().optional(),
    deliveryOption: z.nativeEnum(DeliveryOption).optional(),
    priceMin: z.coerce.number().int().nonnegative().optional(),
    priceMax: z.coerce.number().int().nonnegative().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  })
  .refine(
    (data) => {
      if (data.priceMin !== undefined && data.priceMax !== undefined) {
        return data.priceMin <= data.priceMax;
      }
      return true;
    },
    { message: 'priceMin must be less than or equal to priceMax', path: ['priceMax'] },
  );

// Vendor Status Transition
export const vendorStatusTransitionSchema = z.object({
  vendorId: z.string().uuid(),
  newStatus: z.nativeEnum(VendorStatus),
  reason: z.string().max(500).optional(),
});

// Budget
const BUDGET_NAME_MIN = 1;
const BUDGET_NAME_MAX = 100;
const BUDGET_ITEM_NAME_MAX = 80;

export const createBudgetSchema = z.object({
  name: z.string().min(BUDGET_NAME_MIN).max(BUDGET_NAME_MAX),
  totalAmount: z.number().int().nonnegative().optional(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .optional(),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(BUDGET_NAME_MIN).max(BUDGET_NAME_MAX).optional(),
  totalAmount: z.number().int().nonnegative().optional(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .optional(),
});

export const createBudgetItemSchema = z.object({
  name: z.string().min(1).max(BUDGET_ITEM_NAME_MAX),
  budgeted: z.number().int().nonnegative(),
  actual: z.number().int().nonnegative().optional(),
  notes: z.string().max(200).optional(),
});

export const updateBudgetItemSchema = z.object({
  name: z.string().min(1).max(BUDGET_ITEM_NAME_MAX).optional(),
  budgeted: z.number().int().nonnegative().optional(),
  actual: z.number().int().nonnegative().optional(),
  notes: z.string().max(200).optional(),
});

// Guest List
const GUEST_LIST_NAME_MAX = 100;

export const createGuestListSchema = z.object({
  name: z.string().min(1).max(GUEST_LIST_NAME_MAX),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .optional(),
  plannedCount: z.number().int().positive().optional(),
});

export const updateGuestListSchema = z.object({
  name: z.string().min(1).max(GUEST_LIST_NAME_MAX).optional(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .optional(),
  plannedCount: z.number().int().positive().optional(),
});

const guestPhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Must be E.164 format e.g. +2348012345678')
  .optional();

export const createGuestSchema = z.object({
  name: z.string().min(1).max(100),
  phone: guestPhoneSchema,
  status: z.nativeEnum(GuestStatus).optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

export const updateGuestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: guestPhoneSchema,
  status: z.nativeEnum(GuestStatus).optional(),
  invitationSent: z.boolean().optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

export const bulkCreateGuestsSchema = z.object({
  guests: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        phone: guestPhoneSchema,
      }),
    )
    .min(1)
    .max(100),
});

// Portfolio
export const confirmUploadSchema = z.object({
  publicId: z.string().min(1),
  mediaUrl: z.string().url(),
  mediaType: z.nativeEnum(MediaType),
  caption: z.string().max(200).optional(),
});

// Inquiry
export const createInquirySchema = z.object({
  vendorId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  source: z.nativeEnum(InquirySource),
  message: z.string().max(1000).optional(),
});

export const updateInquiryStatusSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
  notes: z.string().max(500).optional(),
});

// Invoice
const invoiceItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPriceKobo: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1).max(100),
  clientPhone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Must be E.164 format')
    .optional(),
  clientEmail: z.string().email().optional(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  eventLocation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  discountKobo: z.number().int().nonnegative().optional(),
  items: z.array(invoiceItemSchema).min(1).max(50),
  inquiryId: z.string().uuid().optional(),
});

// Subscription tier update (admin only)
export const updateSubscriptionTierSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
});

// Invoice branding
export const updateInvoiceBrandingSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex colour').optional(),
  tagline: z.string().max(100).optional(),
  footerText: z.string().max(200).optional(),
});

export const confirmLogoUploadSchema = z.object({
  logoUrl: z.string().url(),
});

// Client Profile
export const createClientProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(60, 'Display name must be at most 60 characters'),
  email: z.string().email('Must be a valid email address').optional(),
});

export const updateClientProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(60, 'Display name must be at most 60 characters').optional(),
  email: z.string().email('Must be a valid email address').optional(),
});

export const updateInvoiceSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  clientPhone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Must be E.164 format')
    .optional(),
  clientEmail: z.string().email().optional(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  eventLocation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  discountKobo: z.number().int().nonnegative().optional(),
  items: z.array(invoiceItemSchema).min(1).max(50).optional(),
});
