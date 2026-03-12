import { z } from 'zod';
import { VendorCategory, VendorStatus, MediaType, RentalCategory, DeliveryOption } from '../enums';
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
export const createServiceListingSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH),
  description: z.string().min(LISTING_DESCRIPTION_MIN_LENGTH).max(LISTING_DESCRIPTION_MAX_LENGTH),
  category: z.nativeEnum(VendorCategory),
  priceFrom: z.number().int().nonnegative().optional(),
  priceTo: z.number().int().nonnegative().optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
}).refine(priceRangeRefinement, {
  message: 'priceFrom must be less than or equal to priceTo',
  path: ['priceTo'],
});

export const updateServiceListingSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH).optional(),
  description: z.string().min(LISTING_DESCRIPTION_MIN_LENGTH).max(LISTING_DESCRIPTION_MAX_LENGTH).optional(),
  category: z.nativeEnum(VendorCategory).optional(),
  priceFrom: z.number().int().nonnegative().optional(),
  priceTo: z.number().int().nonnegative().optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
}).refine(priceRangeRefinement, {
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
  condition: z.string().max(500).optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
});

export const updateRentalListingSchema = z.object({
  title: z.string().min(LISTING_TITLE_MIN_LENGTH).max(LISTING_TITLE_MAX_LENGTH).optional(),
  description: z.string().min(LISTING_DESCRIPTION_MIN_LENGTH).max(LISTING_DESCRIPTION_MAX_LENGTH).optional(),
  rentalCategory: z.nativeEnum(RentalCategory).optional(),
  quantityAvailable: z.number().int().positive().optional(),
  pricePerDay: z.number().int().positive().optional(),
  depositAmount: z.number().int().nonnegative().optional(),
  deliveryOption: z.nativeEnum(DeliveryOption).optional(),
  condition: z.string().max(500).optional(),
  photos: z.array(z.string().min(1)).max(LISTING_MAX_PHOTOS).optional(),
});

// Review
export const createReviewSchema = z.object({
  vendorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(REVIEW_MIN_BODY_LENGTH).max(2000),
});

export const createVendorReplySchema = z.object({
  body: z.string().min(10).max(1000),
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

// Search
export const searchVendorsSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.nativeEnum(VendorCategory).optional(),
  area: z.string().optional(),
  verifiedOnly: z.coerce.boolean().optional().default(false),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// Vendor Status Transition
export const vendorStatusTransitionSchema = z.object({
  vendorId: z.string().uuid(),
  newStatus: z.nativeEnum(VendorStatus),
  reason: z.string().max(500).optional(),
});

// Portfolio
export const confirmUploadSchema = z.object({
  publicId: z.string().min(1),
  mediaUrl: z.string().url(),
  mediaType: z.nativeEnum(MediaType),
  caption: z.string().max(200).optional(),
});
