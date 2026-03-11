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
