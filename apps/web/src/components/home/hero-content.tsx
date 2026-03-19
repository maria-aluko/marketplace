'use client';

import { useState } from 'react';
import type { ListingSearchResult } from '@eventtrust/shared';
import { HeroSearch } from './hero-search';
import { CategoryBrowser } from './category-browser';

interface HeroContentProps {
  featuredServices: ListingSearchResult[];
  featuredEquipment: ListingSearchResult[];
}

export function HeroContent({ featuredServices, featuredEquipment }: HeroContentProps) {
  const [type, setType] = useState<'service' | 'rental'>('service');

  return (
    <>
      <div className="mt-8 w-full">
        <HeroSearch type={type} onTypeChange={setType} />
      </div>
      <CategoryBrowser
        activeType={type === 'service' ? 'services' : 'equipment'}
        featuredServices={featuredServices}
        featuredEquipment={featuredEquipment}
      />
    </>
  );
}
