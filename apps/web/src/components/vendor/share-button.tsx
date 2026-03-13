'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonProps {
  vendorName: string;
  slug?: string;
  shareUrl?: string;
}

export function ShareButton({ vendorName, slug, shareUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl
    ? typeof window !== 'undefined'
      ? `${window.location.origin}${shareUrl}`
      : shareUrl
    : typeof window !== 'undefined'
      ? `${window.location.origin}/vendors/${slug}`
      : `/vendors/${slug}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out ${vendorName} on EventTrust Nigeria: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${vendorName} — EventTrust Nigeria`,
        url,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-1.5 h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleWhatsAppShare}>Share on WhatsApp</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare}>More options...</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
