import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating value={0} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('fills stars up to value', () => {
    const { container } = render(<StarRating value={3} readonly />);
    const stars = container.querySelectorAll('svg');
    const filled = Array.from(stars).filter((s) => s.classList.contains('fill-yellow-400'));
    expect(filled).toHaveLength(3);
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<StarRating value={2} onChange={handleChange} />);
    fireEvent.click(screen.getByLabelText('4 stars'));
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('disables buttons in readonly mode', () => {
    render(<StarRating value={3} readonly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
