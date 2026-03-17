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
  InquiryStatus,
  InquirySource,
  InvoiceStatus,
  SubscriptionTier,
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
  clientProfileId?: string;
}

// Client Profile
export interface CreateClientProfilePayload {
  displayName: string;
  email?: string;
}

export interface UpdateClientProfilePayload {
  displayName?: string;
  email?: string;
}

export interface ClientProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
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
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSubscriptionTierPayload {
  tier: SubscriptionTier;
}

// Invoice Branding
export interface InvoiceBrandingResponse {
  logoUrl?: string;
  accentColor: string;
  tagline?: string;
  footerText?: string;
}

export interface UpdateInvoiceBrandingPayload {
  accentColor?: string;
  tagline?: string;
  footerText?: string;
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
  invoiceId?: string;
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
  isVerified: boolean;
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
  clientProfileId?: string;
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

// Inquiry
export interface CreateInquiryPayload {
  vendorId: string;
  listingId?: string;
  source: InquirySource;
  message?: string;
}

export interface UpdateInquiryStatusPayload {
  status: InquiryStatus;
  notes?: string;
}

export interface InquiryResponse {
  id: string;
  clientId: string;
  vendorId: string;
  listingId?: string;
  source: InquirySource;
  message?: string;
  notes?: string;
  status: InquiryStatus;
  invoiceId?: string;
  clientPhone?: string;   // populated on vendor-facing queries only
  clientName?: string;    // populated on vendor-facing queries only
  listingTitle?: string;  // populated when listingId is set
  createdAt: string;
  updatedAt: string;
}

// Invoice
export interface CreateInvoiceItemPayload {
  description: string;
  quantity: number;
  unitPriceKobo: number;
  sortOrder?: number;
}

export interface CreateInvoicePayload {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  eventDate?: string;
  eventLocation?: string;
  notes?: string;
  discountKobo?: number;
  items: CreateInvoiceItemPayload[];
  inquiryId?: string;
}

export interface UpdateInvoicePayload {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  eventDate?: string;
  eventLocation?: string;
  notes?: string;
  discountKobo?: number;
  items?: CreateInvoiceItemPayload[];
}

export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceKobo: number;
  totalKobo: number;
  sortOrder: number;
  createdAt: string;
}

export interface InvoiceResponse {
  id: string;
  vendorId: string;
  clientId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  eventDate?: string;
  eventLocation?: string;
  notes?: string;
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  sentAt?: string;
  viewedAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  items: InvoiceItemResponse[];
  branding?: InvoiceBrandingResponse;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummaryResponse {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientName: string;
  eventDate?: string;
  totalKobo: number;
  confirmedAt?: string;
  createdAt: string;
  vendorName?: string;  // populated on client-facing queries only
}

export interface VendorFunnelResponse {
  inquiriesThisMonth: number;
  invoicesSentThisMonth: number;
  confirmedBookingsThisMonth: number;
  completedThisMonth: number;
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
