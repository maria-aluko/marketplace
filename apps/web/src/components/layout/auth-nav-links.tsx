'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface AuthNavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
}

export function AuthNavLinks({ mobile, onLinkClick }: AuthNavLinksProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return null;

  const linkClass = mobile
    ? 'rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50'
    : 'text-gray-600 hover:text-gray-900';

  const primaryLinkClass = mobile
    ? 'rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700'
    : 'rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700';

  if (isAuthenticated) {
    return (
      <>
        <Link href="/search" className={linkClass} onClick={onLinkClick}>
          Find Vendors
        </Link>
        <Link href="/dashboard" className={linkClass} onClick={onLinkClick}>
          Dashboard
        </Link>
        <button
          onClick={() => { logout(); onLinkClick?.(); }}
          className={linkClass}
        >
          Sign Out
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/search" className={linkClass} onClick={onLinkClick}>
        Find Vendors
      </Link>
      <Link href="/vendor/signup" className={linkClass} onClick={onLinkClick}>
        List Your Business
      </Link>
      <Link href="/login" className={primaryLinkClass} onClick={onLinkClick}>
        Sign In
      </Link>
    </>
  );
}
