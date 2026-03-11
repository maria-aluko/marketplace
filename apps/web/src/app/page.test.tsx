import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

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
