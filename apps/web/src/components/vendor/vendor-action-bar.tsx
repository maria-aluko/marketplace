'use client';

import { EnquiryButton } from './enquiry-button';
import { ShareButton } from './share-button';

interface VendorActionBarProps {
  vendorName: string;
  whatsappNumber?: string;
  slug: string;
}

export function VendorActionBar({ vendorName, whatsappNumber, slug }: VendorActionBarProps) {
  return (
    <>
      {/* Fixed bottom bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 md:hidden">
        <EnquiryButton vendorName={vendorName} whatsappNumber={whatsappNumber} />
        <ShareButton vendorName={vendorName} slug={slug} />
      </div>
      {/* Spacer so content isn't hidden behind fixed bar */}
      <div className="h-16 md:hidden" />

      {/* Inline on desktop */}
      <div className="mt-8 hidden items-center gap-3 md:flex">
        <EnquiryButton vendorName={vendorName} whatsappNumber={whatsappNumber} />
        <ShareButton vendorName={vendorName} slug={slug} />
      </div>
    </>
  );
}
