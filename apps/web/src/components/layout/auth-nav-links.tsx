'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@eventtrust/shared';

interface AuthNavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
}

export function AuthNavLinks({ mobile, onLinkClick }: AuthNavLinksProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return null;

  const linkClass = mobile
    ? 'rounded-md px-3 py-2 text-sm text-surface-600 hover:bg-surface-50'
    : 'text-surface-600 hover:text-surface-900';

  const primaryLinkClass = mobile
    ? 'rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700'
    : 'rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700';

  if (isAuthenticated) {
    return (
      <>
        <Link href="/services" className={linkClass} onClick={onLinkClick}>
          Services
        </Link>
        <Link href="/equipment" className={linkClass} onClick={onLinkClick}>
          Equipment
        </Link>
        <Link href="/dashboard" className={linkClass} onClick={onLinkClick}>
          Dashboard
        </Link>
        {user?.role?.toLowerCase() === UserRole.ADMIN && (
          <Link href="/admin" className={linkClass} onClick={onLinkClick}>
            Admin
          </Link>
        )}
        <button
          onClick={() => {
            logout();
            onLinkClick?.();
          }}
          className={linkClass}
        >
          Sign Out
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/services" className={linkClass} onClick={onLinkClick}>
        Services
      </Link>
      <Link href="/equipment" className={linkClass} onClick={onLinkClick}>
        Equipment
      </Link>
      <Link
        href="/vendor/signup"
        className={
          mobile
            ? 'rounded-md border border-primary-600 px-3 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50'
            : 'rounded-md border border-primary-600 px-4 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50'
        }
        onClick={onLinkClick}
      >
        List Your Business
      </Link>
      <Link href="/login" className={primaryLinkClass} onClick={onLinkClick}>
        Sign In
      </Link>
    </>
  );
}
