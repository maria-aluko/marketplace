import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceListingForm } from './service-listing-form';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockPost = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: { post: (...args: any[]) => mockPost(...args) },
}));

describe('ServiceListingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ServiceListingForm />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Price From (kobo)')).toBeInTheDocument();
    expect(screen.getByLabelText('Price To (kobo)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create service listing/i })).toBeInTheDocument();
  });

  it('shows validation error for short title', async () => {
    render(<ServiceListingForm />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hi' } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'This is a valid description that is at least twenty characters long.' },
    });

    const select = screen.getByLabelText('Category');
    fireEvent.change(select, { target: { value: 'caterer' } });

    fireEvent.click(screen.getByRole('button', { name: /create service listing/i }));

    await waitFor(() => {
      expect(screen.getByText(/String must contain at least 5/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('submits valid form and redirects', async () => {
    mockPost.mockResolvedValue({ success: true, data: { data: { id: 'listing-1' } } });

    render(<ServiceListingForm />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Premium Catering Service' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'We offer full-service catering for weddings, birthdays, and corporate events.' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'caterer' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create service listing/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/listings/service', expect.objectContaining({
        title: 'Premium Catering Service',
        category: 'caterer',
      }));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/listings');
    });
  });

  it('shows API error on failure', async () => {
    mockPost.mockResolvedValue({ success: false, error: 'Only active vendors can create listings' });

    render(<ServiceListingForm />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Premium Catering Service' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'We offer full-service catering for weddings, birthdays, and corporate events.' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'caterer' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create service listing/i }));

    await waitFor(() => {
      expect(screen.getByText('Only active vendors can create listings')).toBeInTheDocument();
    });
  });
});
