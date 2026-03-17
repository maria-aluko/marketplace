import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewForm } from './review-form';

const mockPost = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rating and body fields', () => {
    render(<ReviewForm vendorId="00000000-0000-0000-0000-000000000001" vendorName="Test Vendor" vendorSlug="test-vendor" invoiceId="00000000-0000-0000-0000-000000000099" />);
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('validates minimum body length', async () => {
    render(<ReviewForm vendorId="00000000-0000-0000-0000-000000000001" vendorName="Test Vendor" vendorSlug="test-vendor" invoiceId="00000000-0000-0000-0000-000000000099" />);

    // Set rating
    fireEvent.click(screen.getByLabelText('4 stars'));

    // Short body
    fireEvent.change(screen.getByLabelText('Your Review'), {
      target: { value: 'Too short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 50/i)).toBeInTheDocument();
    });
  });

  it('validates rating is required', async () => {
    render(<ReviewForm vendorId="00000000-0000-0000-0000-000000000001" vendorName="Test Vendor" vendorSlug="test-vendor" invoiceId="00000000-0000-0000-0000-000000000099" />);

    fireEvent.change(screen.getByLabelText('Your Review'), {
      target: { value: 'A'.repeat(60) },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      // Rating 0 will fail min(1) validation
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  it('submits review and shows success', async () => {
    mockPost.mockResolvedValue({ success: true, data: {} });

    render(<ReviewForm vendorId="00000000-0000-0000-0000-000000000001" vendorName="Test Vendor" vendorSlug="test-vendor" invoiceId="00000000-0000-0000-0000-000000000099" />);

    // Click 4th star - verify it's enabled first
    const starBtn = screen.getByLabelText('4 stars');
    expect(starBtn).not.toBeDisabled();
    fireEvent.click(starBtn);

    // Wait for star state to be reflected in DOM
    await waitFor(() => {
      const fourthStar = screen.getByLabelText('4 stars');
      const svg = fourthStar.querySelector('svg');
      expect(svg?.classList.contains('fill-yellow-400')).toBe(true);
    });

    fireEvent.change(screen.getByLabelText('Your Review'), {
      target: { value: 'This vendor provided excellent catering for our wedding. Would recommend!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit review/i }));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });

  it('shows API error', async () => {
    mockPost.mockResolvedValue({
      success: false,
      error: 'You have already reviewed this vendor this year',
    });

    render(<ReviewForm vendorId="00000000-0000-0000-0000-000000000001" vendorName="Test Vendor" vendorSlug="test-vendor" invoiceId="00000000-0000-0000-0000-000000000099" />);

    fireEvent.click(screen.getByLabelText('4 stars'));
    fireEvent.change(screen.getByLabelText('Your Review'), {
      target: { value: 'This vendor provided excellent catering for our wedding. Would recommend!' },
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /submit review/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/already reviewed/i)).toBeInTheDocument();
    });
  });
});
