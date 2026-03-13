import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VendorCard } from './vendor-card';
import type { VendorResponse } from '@eventtrust/shared';
import { VendorStatus, VendorCategory } from '@eventtrust/shared';

const mockVendor: VendorResponse = {
  id: 'v-1',
  slug: 'test-catering',
  businessName: 'Test Catering',
  category: VendorCategory.CATERER,
  description: 'Great food for events',
  area: 'Lekki',
  status: VendorStatus.ACTIVE,
  avgRating: 4,
  reviewCount: 12,
  profileCompleteScore: 80,
  userId: 'u-1',
  priceFrom: 50000,
  priceTo: 200000,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('VendorCard', () => {
  it('renders vendor info', () => {
    render(<VendorCard vendor={mockVendor} />);
    expect(screen.getByText('Test Catering')).toBeInTheDocument();
    expect(screen.getByText('caterer')).toBeInTheDocument();
    expect(screen.getByText('Lekki')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('links to vendor slug page', () => {
    render(<VendorCard vendor={mockVendor} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/vendors/test-catering');
  });

  it('shows price range', () => {
    render(<VendorCard vendor={mockVendor} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});
