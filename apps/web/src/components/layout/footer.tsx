import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-surface-900">Company</h3>
            <ul className="space-y-2 text-sm text-surface-500">
              <li>
                <Link href="/about" className="hover:text-surface-700">About</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-surface-700">Contact</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-surface-700">Terms</Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-surface-900">For Vendors</h3>
            <ul className="space-y-2 text-sm text-surface-500">
              <li>
                <Link href="/vendor/signup" className="hover:text-surface-700">List Your Business</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-surface-700">Vendor Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* For Clients */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-surface-900">For Clients</h3>
            <ul className="space-y-2 text-sm text-surface-500">
              <li>
                <Link href="/services" className="hover:text-surface-700">Find Services</Link>
              </li>
              <li>
                <Link href="/equipment" className="hover:text-surface-700">Rent Equipment</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-surface-200 pt-6 sm:flex-row">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} EventTrust Nigeria
          </p>
          <p className="text-sm text-surface-400">Made with trust in Lagos 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
