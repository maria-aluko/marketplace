'use client';

import { MessageCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { InquirySource } from '@eventtrust/shared';

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
  const { user } = useAuth();

  if (!whatsappNumber) return null;

  const phone = whatsappNumber.replace('+', '');
  const text = listingName
    ? listingType
      ? `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}" (${listingType}).`
      : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}".`
    : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in your services.`;
  const message = encodeURIComponent(text);

  const handleClick = () => {
    // Fire-and-forget inquiry capture — never delays WhatsApp open
    if (user) {
      apiClient
        .post('/inquiries', {
          vendorId,
          listingId,
          source: InquirySource.WHATSAPP_BUTTON,
          message: listingName
            ? `Interested in ${listingName}`
            : 'Interested in services',
        })
        .catch(() => {});
    }
  };

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Contact on WhatsApp
    </a>
  );
}
