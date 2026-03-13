import { MessageCircle } from 'lucide-react';

interface EnquiryButtonProps {
  vendorName: string;
  whatsappNumber?: string;
}

export function EnquiryButton({ vendorName, whatsappNumber }: EnquiryButtonProps) {
  if (!whatsappNumber) return null;

  const phone = whatsappNumber.replace('+', '');
  const message = encodeURIComponent(
    `Hi, I found "${vendorName}" on EventTrust Nigeria and I'm interested in your services.`,
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp Enquiry
    </a>
  );
}
