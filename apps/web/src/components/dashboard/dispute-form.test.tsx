import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisputeForm } from './dispute-form';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

describe('DisputeForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dispute form with reason textarea', () => {
    render(
      <DisputeForm reviewId="00000000-0000-0000-0000-000000000001" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    expect(screen.getByLabelText('Dispute Reason')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /file dispute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows validation error when reason is too short', async () => {
    render(
      <DisputeForm reviewId="00000000-0000-0000-0000-000000000001" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    fireEvent.change(screen.getByLabelText('Dispute Reason'), { target: { value: 'too short' } });
    fireEvent.click(screen.getByRole('button', { name: /file dispute/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 20/i)).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits dispute and calls onSuccess', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: { id: 'dispute-1' } });

    render(
      <DisputeForm reviewId="00000000-0000-0000-0000-000000000001" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    fireEvent.change(screen.getByLabelText('Dispute Reason'), {
      target: { value: 'This review is completely false and defamatory towards my business.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /file dispute/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/disputes', expect.objectContaining({
        reviewId: '00000000-0000-0000-0000-000000000001',
        reason: 'This review is completely false and defamatory towards my business.',
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows API error on failure', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: false, error: 'Server error' });

    render(
      <DisputeForm reviewId="00000000-0000-0000-0000-000000000001" onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    fireEvent.change(screen.getByLabelText('Dispute Reason'), {
      target: { value: 'This review is completely false and defamatory towards my business.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /file dispute/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
