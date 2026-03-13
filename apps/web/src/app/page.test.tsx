import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('HomePage', () => {
  it('renders the title', () => {
    render(<HomePage />);
    expect(screen.getByText('EventTrust Nigeria')).toBeInTheDocument();
  });

  it('renders vendor categories', () => {
    render(<HomePage />);
    expect(screen.getByText('caterer')).toBeInTheDocument();
    expect(screen.getByText('photographer')).toBeInTheDocument();
  });
});
