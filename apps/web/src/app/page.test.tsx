import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/server-api', () => ({
  serverFetchRaw: vi.fn().mockResolvedValue(null),
}));

describe('HomePage', () => {
  it('renders the title', async () => {
    const Page = await HomePage();
    render(Page);
    expect(screen.getByText('EventTrust Nigeria')).toBeInTheDocument();
  });

  it('renders service categories', async () => {
    const Page = await HomePage();
    render(Page);
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Photography')).toBeInTheDocument();
  });

  it('renders equipment categories', async () => {
    const Page = await HomePage();
    render(Page);
    expect(screen.getByText('Tents')).toBeInTheDocument();
    expect(screen.getByText('Chairs & Tables')).toBeInTheDocument();
  });

  it('renders dual-path CTA cards', async () => {
    const Page = await HomePage();
    render(Page);
    expect(screen.getByText('Find Services')).toBeInTheDocument();
    expect(screen.getByText('Rent Equipment')).toBeInTheDocument();
  });
});
