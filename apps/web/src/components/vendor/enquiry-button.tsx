import { MessageCircle } from 'lucide-react';

interface EnquiryButtonProps {
  vendorName: string;
  whatsappNumber?: string;
  listingName?: string;
  listingType?: string;
}

export function EnquiryButton({
  vendorName,
  whatsappNumber,
  listingName,
  listingType,
}: EnquiryButtonProps) {
  if (!whatsappNumber) return null;

  const phone = whatsappNumber.replace('+', '');
  const text = listingName
    ? listingType
      ? `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}" (${listingType}).`
      : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in "${listingName}".`
    : `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in your services.`;
  const message = encodeURIComponent(text);

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Contact on WhatsApp
    </a>
  );
}
