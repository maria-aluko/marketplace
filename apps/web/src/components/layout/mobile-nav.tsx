'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 border-b border-gray-200 bg-white p-4 shadow-lg">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Find Vendors
            </Link>
            <Link
              href="/vendor/signup"
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              List Your Business
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
