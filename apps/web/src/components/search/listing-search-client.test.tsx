import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListingSearchPageClient } from './listing-search-client';

const mockReplace = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock('@/components/listings/listing-search-card', () => ({
  ListingSearchCard: ({ listing }: { listing: { title: string } }) => (
    <div data-testid="listing-card">{listing.title}</div>
  ),
}));

const mockListing = {
  id: 'l-1',
  title: 'Professional Catering Service',
  description: 'Full event catering for up to 500 guests',
  listingType: 'service' as const,
  category: 'caterer',
  priceFrom: 100000,
  priceTo: 500000,
  photos: [],
  vendorId: 'v-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  vendor: {
    id: 'v-1',
    slug: 'test-caterer',
    businessName: 'Test Caterer',
    avgRating: 4.5,
    reviewCount: 12,
    area: 'Lekki',
    verified: true,
  },
};

const mockRentalListing = {
  id: 'l-2',
  title: 'Premium Event Tents',
  description: 'Large marquee tents for outdoor events',
  listingType: 'rental' as const,
  category: undefined,
  photos: [],
  vendorId: 'v-2',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  rentalDetails: {
    rentalCategory: 'tent',
    quantityAvailable: 10,
    pricePerDay: 50000,
    deliveryOption: 'both',
  },
  vendor: {
    id: 'v-2',
    slug: 'tent-vendor',
    businessName: 'Tent Vendor',
    avgRating: 4.0,
    reviewCount: 8,
    area: 'Ikeja',
    verified: false,
  },
};

describe('ListingSearchPageClient — services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: { listings: [mockListing], nextCursor: undefined, total: 1 },
    });
  });

  it('renders search input and service-specific filters', () => {
    render(<ListingSearchPageClient defaultListingType="service" />);
    expect(screen.getByLabelText('Search listings')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by area')).toBeInTheDocument();
    expect(screen.getByText('Find Services')).toBeInTheDocument();
  });

  it('fetches and displays service listings', async () => {
    render(<ListingSearchPageClient defaultListingType="service" />);
    await waitFor(() => {
      expect(screen.getByText('Professional Catering Service')).toBeInTheDocument();
    });
    expect(screen.getByText('1 service found')).toBeInTheDocument();
  });

  it('triggers search on text input', async () => {
    render(<ListingSearchPageClient defaultListingType="service" />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Search listings'), {
      target: { value: 'catering' },
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('q=catering'));
    });
  });

  it('shows empty state when no results', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { listings: [], nextCursor: undefined, total: 0 },
    });
    render(<ListingSearchPageClient defaultListingType="service" />);
    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
    });
  });

  it('sends listingType=service in API request', async () => {
    render(<ListingSearchPageClient defaultListingType="service" />);
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('listingType=service'));
    });
  });
});

describe('ListingSearchPageClient — equipment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: { listings: [mockRentalListing], nextCursor: undefined, total: 1 },
    });
  });

  it('renders rental-specific filters', () => {
    render(<ListingSearchPageClient defaultListingType="rental" />);
    expect(screen.getByLabelText('Search listings')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by equipment type')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by delivery option')).toBeInTheDocument();
    expect(screen.getByText('Rent Equipment')).toBeInTheDocument();
  });

  it('fetches and displays rental listings', async () => {
    render(<ListingSearchPageClient defaultListingType="rental" />);
    await waitFor(() => {
      expect(screen.getByText('Premium Event Tents')).toBeInTheDocument();
    });
    expect(screen.getByText('1 item found')).toBeInTheDocument();
  });

  it('sends listingType=rental in API request', async () => {
    render(<ListingSearchPageClient defaultListingType="rental" />);
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('listingType=rental'));
    });
  });

  it('shows empty state for equipment', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { listings: [], nextCursor: undefined, total: 0 },
    });
    render(<ListingSearchPageClient defaultListingType="rental" />);
    await waitFor(() => {
      expect(screen.getByText('No equipment found')).toBeInTheDocument();
    });
  });
});
