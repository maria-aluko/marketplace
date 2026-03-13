import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileEditForm } from './profile-edit-form';

const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockPost = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

const mockVendor = {
  id: 'v-1',
  slug: 'test-catering',
  businessName: 'Test Catering',
  category: 'caterer',
  description: 'We provide excellent catering services for all events in Lagos.',
  area: 'Lekki',
  status: 'active',
  avgRating: 4,
  reviewCount: 5,
  profileCompleteScore: 80,
  userId: 'u-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('ProfileEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: { data: mockVendor },
    });
  });

  it('loads and displays vendor data', async () => {
    render(<ProfileEditForm vendorId="v-1" />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Catering')).toBeInTheDocument();
    });
  });

  it('validates and shows errors', async () => {
    render(<ProfileEditForm vendorId="v-1" />);
    await waitFor(() => screen.getByDisplayValue('Test Catering'));

    fireEvent.change(screen.getByLabelText('Business Name'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least/i)).toBeInTheDocument();
    });
  });

  it('submits update successfully', async () => {
    mockPatch.mockResolvedValue({ success: true, data: {} });
    render(<ProfileEditForm vendorId="v-1" />);
    await waitFor(() => screen.getByDisplayValue('Test Catering'));

    fireEvent.change(screen.getByLabelText('Business Name'), {
      target: { value: 'Updated Catering' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
    expect(mockPatch).toHaveBeenCalledWith('/vendors/v-1', expect.objectContaining({
      businessName: 'Updated Catering',
    }));
  });
});
