'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VendorCategory } from '@eventtrust/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const categories = Object.values(VendorCategory);

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        EventTrust Nigeria
      </h1>
      <p className="mt-4 max-w-md text-center text-gray-600">
        Find verified event vendors in Lagos. Caterers, photographers, venues, and more —
        all reviewed and trusted.
      </p>

      {/* Hero search bar */}
      <form onSubmit={handleSearch} className="mt-8 flex w-full max-w-md gap-2">
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Search className="mr-1.5 h-4 w-4" />
          Search
        </Button>
      </form>

      {/* Category grid */}
      <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/search?category=${category}`}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            {category.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>
    </main>
  );
}
