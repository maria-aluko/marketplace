import { VendorCategory } from '@eventtrust/shared';

const categories = Object.values(VendorCategory);

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        EventTrust Nigeria
      </h1>
      <p className="mt-4 max-w-md text-center text-gray-600">
        Find verified event vendors in Lagos. Caterers, photographers, venues, and more —
        all reviewed and trusted.
      </p>

      <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600"
          >
            {category.replace(/_/g, ' ')}
          </div>
        ))}
      </div>
    </main>
  );
}
