import {
  VendorStatus,
  UserRole,
  VendorCategory,
  ReviewStatus,
  DisputeStatus,
  MediaType,
  ListingType,
  RentalCategory,
  DeliveryOption,
  RentalCondition,
  GuestStatus,
} from '../enums';

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
  priceFrom?: number; // kobo
  priceTo?: number; // kobo
  photos?: string[]; // Cloudinary secure_urls
}

export interface CreateRentalListingPayload {
  title: string;
  description: string;
  rentalCategory: RentalCategory;
  quantityAvailable: number;
  pricePerDay: number; // kobo
  depositAmount?: number; // kobo
  deliveryOption: DeliveryOption;
  condition?: RentalCondition;
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
  condition?: RentalCondition;
}

export interface ListingResponse {
  id: string;
  vendorId: string;
  listingType: ListingType;
  title: string;
  description: string;
  category?: VendorCategory; // service listings only
  priceFrom?: number;
  priceTo?: number;
  photos: string[];
  avgRating: number;
  reviewCount: number;
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
  listingId?: string;
  rating: number;
  body: string;
}

export interface ReviewResponse {
  id: string;
  vendorId: string;
  listingId?: string;
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

// Search — Vendors
export interface SearchVendorsQuery {
  q?: string;
  category?: VendorCategory;
  area?: string;
  listingType?: ListingType;
  rentalCategory?: RentalCategory;
  verifiedOnly?: boolean;
  cursor?: string;
  limit?: number;
}

export interface SearchVendorsResponse {
  vendors: VendorResponse[];
  nextCursor?: string;
  total: number;
}

// Search — Listings
export interface SearchListingsQuery {
  q?: string;
  listingType?: ListingType;
  category?: VendorCategory;
  rentalCategory?: RentalCategory;
  area?: string;
  deliveryOption?: DeliveryOption;
  priceMin?: number;
  priceMax?: number;
  cursor?: string;
  limit?: number;
}

export interface ListingVendorSummary {
  id: string;
  slug: string;
  businessName: string;
  avgRating: number;
  reviewCount: number;
  area: string;
  verified: boolean;
  whatsappNumber?: string;
}

export interface ListingSearchResult extends ListingResponse {
  vendor: ListingVendorSummary;
}

export interface SearchListingsResponse {
  listings: ListingSearchResult[];
  nextCursor?: string;
  total: number;
}

// Budget
export interface BudgetItemResponse {
  id: string;
  budgetId: string;
  name: string;
  budgeted: number;
  actual: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetResponse {
  id: string;
  userId: string;
  name: string;
  totalAmount?: number;  // kobo — overall budget cap set by user
  eventDate?: string;
  items: BudgetItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummaryResponse {
  id: string;
  userId: string;
  name: string;
  totalAmount?: number;  // kobo
  eventDate?: string;
  itemCount: number;
  totalBudgeted: number;
  totalActual: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetPayload {
  name: string;
  totalAmount?: number;  // kobo
  eventDate?: string;
}

export interface UpdateBudgetPayload {
  name?: string;
  totalAmount?: number;  // kobo, send 0 to clear
  eventDate?: string;
}

export interface CreateBudgetItemPayload {
  name: string;
  budgeted: number;
  actual?: number;
  notes?: string;
}

export interface UpdateBudgetItemPayload {
  name?: string;
  budgeted?: number;
  actual?: number;
  notes?: string;
}

// Guest List
export interface GuestResponse {
  id: string;
  guestListId: string;
  name: string;
  phone?: string;
  status: GuestStatus;
  invitationSent: boolean;
  plusOne: boolean;
  plusOneName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestListResponse {
  id: string;
  userId: string;
  name: string;
  eventDate?: string;
  plannedCount?: number;
  guests: GuestResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestListSummaryResponse {
  id: string;
  userId: string;
  name: string;
  eventDate?: string;
  plannedCount?: number;
  totalGuests: number;
  totalAttending: number;
  totalDeclined: number;
  totalPending: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestListPayload {
  name: string;
  eventDate?: string;
  plannedCount?: number;
}

export interface UpdateGuestListPayload {
  name?: string;
  eventDate?: string;
  plannedCount?: number;
}

export interface CreateGuestPayload {
  name: string;
  phone?: string;
  status?: GuestStatus;
  plusOne?: boolean;
  plusOneName?: string;
  notes?: string;
}

export interface UpdateGuestPayload {
  name?: string;
  phone?: string;
  status?: GuestStatus;
  invitationSent?: boolean;
  plusOne?: boolean;
  plusOneName?: string;
  notes?: string;
}

export interface BulkCreateGuestsPayload {
  guests: Array<{ name: string; phone?: string }>;
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
