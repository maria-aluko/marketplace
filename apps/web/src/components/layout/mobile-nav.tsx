'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AuthNavLinks } from './auth-nav-links';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-md p-2 text-surface-600 hover:bg-surface-100"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-surface-200 bg-white p-4 shadow-lg">
          <nav className="flex flex-col space-y-3">
            <AuthNavLinks mobile onLinkClick={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </div>
  );
}
