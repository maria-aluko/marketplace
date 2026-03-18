import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { AuthNavLinks } from './auth-nav-links';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-bold select-none">
            ET
          </span>
          <span className="font-display text-lg font-bold text-surface-900">
            Event<span className="text-primary-600">Trust</span>
          </span>
        </Link>

        <nav className="hidden items-center space-x-6 text-sm md:flex">
          <AuthNavLinks />
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
