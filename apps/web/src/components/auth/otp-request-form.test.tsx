import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpRequestForm } from './otp-request-form';

// Mock the auth context
const mockRequestOtp = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    requestOtp: mockRequestOtp,
    error: null,
    submitting: false,
  }),
}));

describe('OtpRequestForm', () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders phone input', () => {
    render(<OtpRequestForm onSuccess={onSuccess} />);
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('validates E.164 format', async () => {
    render(<OtpRequestForm onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Phone Number');
    fireEvent.change(input, { target: { value: '08012345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/E\.164 format/i)).toBeInTheDocument();
    });
    expect(mockRequestOtp).not.toHaveBeenCalled();
  });

  it('calls requestOtp with valid phone', async () => {
    mockRequestOtp.mockResolvedValue({ message: 'OTP sent', expiresAt: new Date().toISOString() });
    render(<OtpRequestForm onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Phone Number');
    fireEvent.change(input, { target: { value: '+2348012345678' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('+2348012345678');
      expect(onSuccess).toHaveBeenCalledWith('+2348012345678');
    });
  });
});
