import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { AuthNavLinks } from './auth-nav-links';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-lg font-bold text-primary-600">EventTrust</span>
        </Link>

        <nav className="hidden items-center space-x-6 text-sm md:flex">
          <AuthNavLinks />
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
