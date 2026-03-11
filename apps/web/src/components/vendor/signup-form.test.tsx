import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorSignupForm } from './signup-form';

const mockPush = vi.fn();
const mockPost = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

describe('VendorSignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 fields', () => {
    render(<VendorSignupForm />);
    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Area in Lagos')).toBeInTheDocument();
  });

  it('validates step 1 before advancing', async () => {
    render(<VendorSignupForm />);

    // Clear business name
    const input = screen.getByLabelText('Business Name');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('navigates to step 2', async () => {
    render(<VendorSignupForm />);

    fireEvent.change(screen.getByLabelText('Business Name'), {
      target: { value: 'Test Business' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  it('submits and creates vendor', async () => {
    mockPost.mockResolvedValue({ success: true, data: { data: { id: 'v-1' } } });
    render(<VendorSignupForm />);

    // Step 1
    fireEvent.change(screen.getByLabelText('Business Name'), {
      target: { value: 'Test Business' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2
    await waitFor(() => screen.getByLabelText('Description'));
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'This is a great business with over 10 years of experience in Lagos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3
    await waitFor(() => screen.getByLabelText(/whatsapp/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 4 - Review
    await waitFor(() => screen.getByText('Review your listing'));
    fireEvent.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/vendors', expect.any(Object));
    });
  });
});
