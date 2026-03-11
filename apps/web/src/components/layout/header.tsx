import Link from 'next/link';
import { MobileNav } from './mobile-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-lg font-bold text-primary-600">EventTrust</span>
        </Link>

        <nav className="hidden items-center space-x-6 text-sm md:flex">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Find Vendors
          </Link>
          <Link href="/vendor/signup" className="text-gray-600 hover:text-gray-900">
            List Your Business
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Sign In
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
