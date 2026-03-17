'use client';

import { useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { InquirySource } from '@eventtrust/shared';
import { ClientProfileSetupSheet } from '@/components/client/client-profile-setup-sheet';

interface EnquiryButtonProps {
  vendorId: string;
  vendorName: string;
  whatsappNumber?: string;
  listingId?: string;
  listingName?: string;
  listingType?: string;
}

export function EnquiryButton({
  vendorId,
  vendorName,
  whatsappNumber,
  listingId,
  listingName,
  listingType,
}: EnquiryButtonProps) {
  const { user, isLoading } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);

  if (!whatsappNumber) return null;

  const phone = whatsappNumber.replace('+', '');
  const text = listingName
    ? listingType
      ? `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}" (${listingType}).`
      : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}".`
    : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in your services.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  const fireInquiry = () => {
    if (!user) return;
    apiClient
      .post('/inquiries', {
        vendorId,
        listingId,
        source: InquirySource.WHATSAPP_BUTTON,
        message: listingName ? `Interested in ${listingName}` : 'Interested in services',
      })
      .catch(() => {});
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoading) return; // auth unknown — let href open WhatsApp directly

    if (!user || !user.clientProfileId) {
      e.preventDefault();
      pendingUrlRef.current = whatsappUrl;
      setSheetOpen(true);
    } else {
      fireInquiry();
    }
  };

  return (
    <>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Contact on WhatsApp
      </a>
      <ClientProfileSetupSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => {
          setSheetOpen(false);
          const url = pendingUrlRef.current;
          if (url) {
            pendingUrlRef.current = null;
            fireInquiry();
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }}
      />
    </>
  );
}
