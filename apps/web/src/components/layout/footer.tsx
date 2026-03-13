export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <p className="text-sm text-surface-500">
            EventTrust Nigeria. Find verified event vendors in Lagos.
          </p>
          <div className="flex space-x-6 text-sm text-surface-500">
            <a href="#" className="hover:text-surface-700">
              About
            </a>
            <a href="#" className="hover:text-surface-700">
              Contact
            </a>
            <a href="#" className="hover:text-surface-700">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
