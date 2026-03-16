export enum VendorStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  CHANGES_REQUESTED = 'changes_requested',
  SUSPENDED = 'suspended',
}

export enum UserRole {
  CLIENT = 'client',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REMOVED = 'removed',
}

export enum DisputeStatus {
  OPEN = 'open',
  DECIDED = 'decided',
  APPEALED = 'appealed',
  CLOSED = 'closed',
}

export enum VendorCategory {
  CATERER = 'caterer',
  PHOTOGRAPHER = 'photographer',
  VIDEOGRAPHER = 'videographer',
  VENUE = 'venue',
  DECORATOR = 'decorator',
  MC = 'mc',
  DJ = 'dj',
  MAKEUP_ARTIST = 'makeup_artist',
  PLANNER = 'planner',
  OTHER = 'other',
}

export enum AuthProvider {
  PHONE = 'phone',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ListingType {
  SERVICE = 'service',
  RENTAL = 'rental',
}

export enum RentalCategory {
  TENT = 'tent',
  CHAIRS_TABLES = 'chairs_tables',
  COOKING_EQUIPMENT = 'cooking_equipment',
  GENERATOR = 'generator',
  LIGHTING = 'lighting',
  OTHER_RENTAL = 'other_rental',
}

export enum DeliveryOption {
  PICKUP_ONLY = 'pickup_only',
  DELIVERY_ONLY = 'delivery_only',
  BOTH = 'both',
}

export enum RentalCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PRO_PLUS = 'pro_plus',
}

export enum GuestStatus {
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  COMING = 'COMING',
  NOT_COMING = 'NOT_COMING',
}
