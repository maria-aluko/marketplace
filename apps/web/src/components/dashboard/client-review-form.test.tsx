import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientReviewForm } from './client-review-form';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

// Mock StarRating since it may have complex event handling
vi.mock('@/components/ui/star-rating', () => ({
  StarRating: ({ onChange }: { onChange: (v: number) => void }) => (
    <div>
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
    </div>
  ),
}));

describe('ClientReviewForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    clientId: '00000000-0000-0000-0000-000000000010',
    invoiceId: '00000000-0000-0000-0000-000000000099',
    clientName: 'Adaeze Okafor',
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the client review form', () => {
    render(<ClientReviewForm {...defaultProps} />);

    expect(screen.getByText('Rate Adaeze Okafor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit rating/i })).toBeInTheDocument();
  });

  it('submits successfully with rating', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: { id: 'cr-1' } });

    render(<ClientReviewForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '4' })); // select 4 stars
    fireEvent.click(screen.getByRole('button', { name: /submit rating/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/client-reviews', expect.objectContaining({
        clientId: '00000000-0000-0000-0000-000000000010',
        invoiceId: '00000000-0000-0000-0000-000000000099',
        rating: 4,
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows API error on failure', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: false, error: 'Failed to submit' });

    render(<ClientReviewForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: /submit rating/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to submit')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
