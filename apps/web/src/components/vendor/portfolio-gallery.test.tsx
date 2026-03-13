import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PortfolioGallery } from './portfolio-gallery';
import type { PortfolioItem } from '@eventtrust/shared';
import { MediaType } from '@eventtrust/shared';

const mockItems: PortfolioItem[] = [
  {
    id: 'p-1',
    vendorId: 'v-1',
    mediaUrl: 'https://example.com/img1.jpg',
    mediaType: MediaType.IMAGE,
    caption: 'Wedding setup',
    sortOrder: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'p-2',
    vendorId: 'v-1',
    mediaUrl: 'https://example.com/vid1.mp4',
    mediaType: MediaType.VIDEO,
    caption: 'Event video',
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

describe('PortfolioGallery', () => {
  it('renders grid of portfolio items', () => {
    render(<PortfolioGallery items={mockItems} />);
    expect(screen.getByAltText('Wedding setup')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<PortfolioGallery items={[]} />);
    expect(screen.getByText('No portfolio items yet.')).toBeInTheDocument();
  });

  it('opens lightbox on click', () => {
    render(<PortfolioGallery items={mockItems} />);
    fireEvent.click(screen.getByAltText('Wedding setup'));
    expect(screen.getByText('Portfolio item')).toBeInTheDocument();
  });
});
