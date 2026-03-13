import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioUploader } from './portfolio-uploader';

const mockPost = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('PortfolioUploader', () => {
  const defaultProps = {
    vendorId: 'v-1',
    remainingImages: 5,
    remainingVideos: 2,
    onUploadComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drop zone and browse button', () => {
    render(<PortfolioUploader {...defaultProps} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
  });

  it('shows file input for uploads', () => {
    render(<PortfolioUploader {...defaultProps} />);
    expect(screen.getByLabelText('Upload files')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    render(<PortfolioUploader {...defaultProps} />);
    const input = screen.getByLabelText('Upload files');

    const invalidFile = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    });
  });

  it('enforces image limit', async () => {
    render(<PortfolioUploader {...defaultProps} remainingImages={0} />);
    const input = screen.getByLabelText('Upload files');

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/image limit reached/i)).toBeInTheDocument();
    });
  });

  it('adds valid files to upload queue', async () => {
    render(<PortfolioUploader {...defaultProps} />);
    const input = screen.getByLabelText('Upload files');

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText(/upload 1 file/i)).toBeInTheDocument();
    });
  });
});
