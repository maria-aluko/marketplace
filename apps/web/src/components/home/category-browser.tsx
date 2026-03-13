'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  VendorCategory,
  RentalCategory,
  CATEGORY_LABELS,
  RENTAL_CATEGORY_LABELS,
} from '@eventtrust/shared';
import { Briefcase, Package } from 'lucide-react';
import { CATEGORY_ICONS, RENTAL_CATEGORY_ICONS } from '@/lib/category-meta';

const serviceCategories = Object.values(VendorCategory);
const rentalCategories = Object.values(RentalCategory);

type Selection = 'services' | 'equipment';

export function CategoryBrowser() {
  const [selected, setSelected] = useState<Selection>('services');

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* CTA toggle cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSelected('services')}
          className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-colors ${
            selected === 'services'
              ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-200'
              : 'border-primary-200 bg-primary-50 hover:border-primary-400 hover:bg-primary-100'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Find Services</h2>
            <p className="text-sm text-surface-600">Caterers, photographers, DJs &amp; more</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelected('equipment')}
          className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-colors ${
            selected === 'equipment'
              ? 'border-celebration-500 bg-celebration-100 ring-2 ring-celebration-200'
              : 'border-celebration-200 bg-celebration-50 hover:border-celebration-400 hover:bg-celebration-100'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-celebration-500 text-white">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Rent Equipment</h2>
            <p className="text-sm text-surface-600">Tents, chairs, generators &amp; more</p>
          </div>
        </button>
      </div>

      {/* Category grid — only the selected one */}
      <div className="mt-8">
        {selected === 'services' ? (
          <div>
            <h3 className="mb-4 text-center text-base font-semibold text-surface-900">
              Browse Services by Category
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {serviceCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/services?category=${category}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                  >
                    <Icon className="h-6 w-6 text-primary-600" />
                    <span className="text-sm font-medium text-surface-700">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-center text-base font-semibold text-surface-900">
              Browse Equipment by Category
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rentalCategories.map((category) => {
                const Icon = RENTAL_CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/equipment?rentalCategory=${category}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-4 text-center transition-colors hover:border-celebration-400 hover:bg-celebration-50"
                  >
                    <Icon className="h-6 w-6 text-celebration-600" />
                    <span className="text-sm font-medium text-surface-700">
                      {RENTAL_CATEGORY_LABELS[category]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
