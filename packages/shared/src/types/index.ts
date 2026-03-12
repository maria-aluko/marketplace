import { VendorStatus, UserRole, VendorCategory, ReviewStatus, DisputeStatus, MediaType, ListingType, RentalCategory, DeliveryOption } from '../enums';

// Auth
export interface OtpRequestPayload {
  phone: string;
}

export interface OtpVerifyPayload {
  phone: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  vendorId?: string;
}

// Vendor
export interface CreateVendorPayload {
  businessName: string;
  category: VendorCategory;
  description: string;
  area: string;
  address?: string;
  priceFrom?: number;
  priceTo?: number;
  whatsappNumber?: string;
  instagramHandle?: string;
}

export interface UpdateVendorPayload extends Partial<CreateVendorPayload> {}

export interface VendorResponse {
  id: string;
  slug: string;
  businessName: string;
  category: VendorCategory;
  description: string;
  area: string;
  address?: string;
  priceFrom?: number;
  priceTo?: number;
  whatsappNumber?: string;
  instagramHandle?: string;
  status: VendorStatus;
  avgRating: number;
  reviewCount: number;
  profileCompleteScore: number;
  coverImageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Listing
export interface CreateServiceListingPayload {
  title: string;
  description: string;
  category: VendorCategory;
  priceFrom?: number;   // kobo
  priceTo?: number;     // kobo
  photos?: string[];    // Cloudinary public_ids
}

export interface CreateRentalListingPayload {
  title: string;
  description: string;
  rentalCategory: RentalCategory;
  quantityAvailable: number;
  pricePerDay: number;       // kobo
  depositAmount?: number;    // kobo
  deliveryOption: DeliveryOption;
  condition?: string;
  photos?: string[];
}

export interface UpdateServiceListingPayload extends Partial<CreateServiceListingPayload> {}
export interface UpdateRentalListingPayload extends Partial<CreateRentalListingPayload> {}

export interface ListingRentalDetailsResponse {
  rentalCategory: RentalCategory;
  quantityAvailable: number;
  pricePerDay: number;
  depositAmount?: number;
  deliveryOption: DeliveryOption;
  condition?: string;
}

export interface ListingResponse {
  id: string;
  vendorId: string;
  listingType: ListingType;
  title: string;
  description: string;
  category?: VendorCategory;      // service listings only
  priceFrom?: number;
  priceTo?: number;
  photos: string[];
  rentalDetails?: ListingRentalDetailsResponse;
  createdAt: string;
  updatedAt: string;
}

// Portfolio
export interface PortfolioItem {
  id: string;
  vendorId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string;
  sortOrder: number;
  createdAt: string;
}

export interface SignedUploadResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface ConfirmUploadPayload {
  publicId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string;
}

// Review
export interface CreateReviewPayload {
  vendorId: string;
  rating: number;
  body: string;
}

export interface ReviewResponse {
  id: string;
  vendorId: string;
  clientId: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  reply?: VendorReplyResponse;
  createdAt: string;
  updatedAt: string;
}

export interface VendorReplyResponse {
  id: string;
  reviewId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorReplyPayload {
  body: string;
}

// Dispute
export interface CreateDisputePayload {
  reviewId: string;
  reason: string;
}

export interface DisputeResponse {
  id: string;
  reviewId: string;
  vendorId: string;
  reason: string;
  status: DisputeStatus;
  adminDecision?: string;
  policyClause?: string;
  appealReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeDecisionPayload {
  decision: string;
  policyClause: string;
  removeReview: boolean;
}

export interface DisputeAppealPayload {
  reason: string;
}

// Search
export interface SearchVendorsQuery {
  q?: string;
  category?: VendorCategory;
  area?: string;
  verifiedOnly?: boolean;
  cursor?: string;
  limit?: number;
}

export interface SearchVendorsResponse {
  vendors: VendorResponse[];
  nextCursor?: string;
  total: number;
}

// Admin
export interface AdminAnalytics {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  totalReviews: number;
  pendingReviews: number;
  openDisputes: number;
  totalClients: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  total: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Vendor Status Transition
export interface VendorStatusTransitionPayload {
  vendorId: string;
  newStatus: VendorStatus;
  reason?: string;
}

// JWT Payloads
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  vendorId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string;
}

// CSRF
export interface CsrfTokenResponse {
  csrfToken: string;
}

// OTP
export interface OtpRequestResponse {
  message: string;
  expiresAt: string;
}

// Auth Response (tokens in httpOnly cookies, not body)
export interface AuthResponse {
  user: AuthUser;
}

// Health
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    termii: 'up' | 'down' | 'unknown';
    cloudinary: 'up' | 'down' | 'unknown';
  };
}
