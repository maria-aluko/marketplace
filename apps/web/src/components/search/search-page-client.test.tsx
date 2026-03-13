import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchPageClient } from './search-page-client';

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

const mockVendor = {
  id: 'v-1',
  slug: 'test-vendor',
  businessName: 'Test Vendor',
  category: 'caterer',
  description: 'Test description',
  area: 'Lekki',
  status: 'active',
  avgRating: 4,
  reviewCount: 5,
  profileCompleteScore: 80,
  userId: 'u-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('SearchPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: { vendors: [mockVendor], nextCursor: undefined, total: 1 },
    });
  });

  it('renders search input and filters', () => {
    render(<SearchPageClient />);
    expect(screen.getByLabelText('Search vendors')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by area')).toBeInTheDocument();
    expect(screen.getByLabelText('Verified only')).toBeInTheDocument();
  });

  it('fetches and displays vendors', async () => {
    render(<SearchPageClient />);
    await waitFor(() => {
      expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    });
    expect(screen.getByText('1 vendor found')).toBeInTheDocument();
  });

  it('triggers search on text input', async () => {
    render(<SearchPageClient />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Search vendors'), {
      target: { value: 'catering' },
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('q=catering'));
    });
  });

  it('shows empty state when no results', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { vendors: [], nextCursor: undefined, total: 0 },
    });
    render(<SearchPageClient />);
    await waitFor(() => {
      expect(screen.getByText('No vendors found')).toBeInTheDocument();
    });
  });
});
