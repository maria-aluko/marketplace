import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewsManager } from './reviews-manager';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

const recentDate = new Date().toISOString();

const mockReviews = [
  {
    id: 'r-1',
    vendorId: 'v-1',
    clientId: 'c-1',
    rating: 5,
    body: 'Amazing service! Would definitely recommend to anyone looking for great catering.',
    status: 'approved',
    reply: null,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'r-2',
    vendorId: 'v-1',
    clientId: 'c-2',
    rating: 3,
    body: 'Decent service but could improve on timing and communication with customers.',
    status: 'approved',
    reply: {
      id: 'rp-1',
      reviewId: 'r-2',
      body: 'Thank you for the feedback',
      createdAt: recentDate,
      updatedAt: recentDate,
    },
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-01T00:00:00Z',
  },
];

describe('ReviewsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      success: true,
      data: { data: mockReviews },
    });
  });

  it('loads and displays reviews', async () => {
    render(<ReviewsManager vendorId="v-1" />);
    await waitFor(() => {
      expect(screen.getByText(/amazing service/i)).toBeInTheDocument();
      expect(screen.getByText(/decent service/i)).toBeInTheDocument();
    });
  });

  it('shows reply button for reviews without reply', async () => {
    render(<ReviewsManager vendorId="v-1" />);
    await waitFor(() => {
      expect(screen.getByText('Reply')).toBeInTheDocument();
    });
  });

  it('opens reply form on click', async () => {
    render(<ReviewsManager vendorId="v-1" />);
    await waitFor(() => screen.getByText('Reply'));

    fireEvent.click(screen.getByText('Reply'));
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument();
  });

  it('shows edit button for recent replies', async () => {
    render(<ReviewsManager vendorId="v-1" />);
    await waitFor(() => {
      expect(screen.getByText('Edit Reply')).toBeInTheDocument();
    });
  });

  it('submits a new reply', async () => {
    mockPost.mockResolvedValue({ success: true, data: {} });
    render(<ReviewsManager vendorId="v-1" />);
    await waitFor(() => screen.getByText('Reply'));

    fireEvent.click(screen.getByText('Reply'));
    fireEvent.change(screen.getByPlaceholderText(/write your reply/i), {
      target: { value: 'Thank you for the kind words!' },
    });
    fireEvent.click(screen.getByText('Send Reply'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/reviews/r-1/reply', {
        body: 'Thank you for the kind words!',
      });
    });
  });
});
