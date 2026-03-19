'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Package } from 'lucide-react';

interface HeroSearchProps {
  type: 'service' | 'rental';
  onTypeChange: (t: 'service' | 'rental') => void;
}

export function HeroSearch({ type, onTypeChange }: HeroSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const path = type === 'service' ? '/services' : '/equipment';
    router.push(`${path}${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const isEquipment = type === 'rental';

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white px-4 py-4 shadow-lg ring-1 ring-surface-200">
      {/* Segmented pill control */}
      <div className="mb-3 flex rounded-full bg-surface-100 p-1">
        <button
          type="button"
          onClick={() => onTypeChange('service')}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-150 ${
            !isEquipment
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          Services
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('rental')}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-150 ${
            isEquipment
              ? 'bg-celebration-500 text-white shadow-sm'
              : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <Package className="h-3.5 w-3.5 shrink-0" />
          Equipment
        </button>
      </div>

      {/* Search input + button */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder={
            isEquipment
              ? 'Search tents, chairs, generators…'
              : 'Search caterers, photographers…'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-surface-200 bg-surface-50 placeholder:text-surface-400"
        />
        <Button
          type="submit"
          className={isEquipment ? 'bg-celebration-500 hover:bg-celebration-600' : ''}
        >
          <Search className="mr-1.5 h-4 w-4" />
          Search
        </Button>
      </form>
    </div>
  );
}
