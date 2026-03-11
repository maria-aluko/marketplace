import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpVerifyForm } from './otp-verify-form';

const mockVerifyOtp = vi.fn();
const mockRequestOtp = vi.fn();
const mockPush = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    verifyOtp: mockVerifyOtp,
    requestOtp: mockRequestOtp,
    error: null,
    submitting: false,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('OtpVerifyForm', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 6 digit inputs', () => {
    render(<OtpVerifyForm phone="+2348012345678" onBack={onBack} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('auto-advances focus on digit entry', () => {
    render(<OtpVerifyForm phone="+2348012345678" onBack={onBack} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0]!, { target: { value: '1' } });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('shows the phone number', () => {
    render(<OtpVerifyForm phone="+2348012345678" onBack={onBack} />);
    expect(screen.getByText('+2348012345678')).toBeInTheDocument();
  });

  it('calls verifyOtp on submit with full code', async () => {
    mockVerifyOtp.mockResolvedValue({ id: 'user-1', phone: '+2348012345678', role: 'client' });
    render(<OtpVerifyForm phone="+2348012345678" onBack={onBack} />);
    const inputs = screen.getAllByRole('textbox');

    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(inputs[i]!, { target: { value: digit } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith('+2348012345678', '123456');
    });
  });
});
