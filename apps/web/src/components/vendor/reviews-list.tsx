import type { ReviewResponse } from '@eventtrust/shared';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { WriteReviewButton } from './write-review-button';
import { formatDate } from '@/lib/utils';

interface ReviewsListProps {
  reviews: ReviewResponse[];
  vendorId: string;
}

export function ReviewsList({ reviews, vendorId }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-surface-500">No reviews yet.</p>
        <WriteReviewButton vendorId={vendorId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-surface-100 pb-6 last:border-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-surface-500">{formatDate(review.createdAt)}</span>
            {review.isVerified && (
              <Badge variant="verified" className="text-[10px] px-1.5 py-0">
                Verified Booking
              </Badge>
            )}
            {review.listingTitle && (
              <span className="text-xs text-surface-500 bg-surface-100 px-1.5 py-0.5 rounded">
                re: {review.listingTitle}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-surface-700">{review.body}</p>

          {review.dispute && (
            <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              This review has an active dispute.
            </p>
          )}

          {review.reply && (
            <div className="mt-3 ml-4 border-l-2 border-surface-200 pl-4">
              <p className="text-xs font-medium text-surface-500">Vendor reply</p>
              <p className="mt-1 text-sm text-surface-600">{review.reply.body}</p>
              <span className="text-xs text-surface-400">{formatDate(review.reply.createdAt)}</span>
            </div>
          )}
        </div>
      ))}
      <WriteReviewButton vendorId={vendorId} />
    </div>
  );
}
