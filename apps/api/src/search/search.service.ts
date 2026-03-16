import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SearchVendorsQuery,
  SearchVendorsResponse,
  VendorResponse,
  SearchListingsQuery,
  SearchListingsResponse,
  ListingSearchResult,
  ListingVendorSummary,
  ListingRentalDetailsResponse,
} from '@eventtrust/shared';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchVendorsQuery): Promise<SearchVendorsResponse> {
    const limit = query.limit ?? 20;
    const conditions: string[] = [`v.deleted_at IS NULL`, `v.status = 'ACTIVE'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.category) {
      conditions.push(`v.category = $${paramIndex}::vendor_category`);
      params.push(query.category.toUpperCase());
      paramIndex++;
    }

    if (query.area) {
      conditions.push(`v.area = $${paramIndex}`);
      params.push(query.area);
      paramIndex++;
    }

    if (query.q) {
      conditions.push(
        `(v.business_name ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`,
      );
      params.push(`%${query.q}%`);
      paramIndex++;
    }

    if (query.listingType) {
      conditions.push(
        `EXISTS (SELECT 1 FROM listings l WHERE l.vendor_id = v.id AND l.deleted_at IS NULL AND l.type = $${paramIndex}::listing_type)`,
      );
      params.push(query.listingType.toUpperCase());
      paramIndex++;
    }

    if (query.rentalCategory) {
      conditions.push(
        `EXISTS (SELECT 1 FROM listings l JOIN listing_rental_details lrd ON lrd.listing_id = l.id WHERE l.vendor_id = v.id AND l.deleted_at IS NULL AND lrd.rental_category = $${paramIndex}::rental_category)`,
      );
      params.push(query.rentalCategory.toUpperCase());
      paramIndex++;
    }

    // Cursor pagination
    let cursorScore: number | null = null;
    let cursorId: string | null = null;
    if (query.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(query.cursor, 'base64url').toString());
        cursorScore = decoded.score;
        cursorId = decoded.id;
      } catch {
        // Invalid cursor, ignore
      }
    }

    if (cursorScore !== null && cursorId !== null) {
      conditions.push(
        `((
          v.avg_rating * 0.5 +
          (LEAST(v.review_count, 50)::float / 50.0) * 0.3 +
          v.profile_complete_score * 0.1 +
          GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - v.updated_at)) / 31536000.0) * 0.1
        ) < $${paramIndex} OR (
          (
            v.avg_rating * 0.5 +
            (LEAST(v.review_count, 50)::float / 50.0) * 0.3 +
            v.profile_complete_score * 0.1 +
            GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - v.updated_at)) / 31536000.0) * 0.1
          ) = $${paramIndex} AND v.id > $${paramIndex + 1}::uuid
        ))`,
      );
      params.push(cursorScore, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count (without cursor)
    const countConditions = conditions.filter((_, i) => {
      // Remove cursor condition (last one added if cursor exists)
      if (cursorScore !== null && cursorId !== null) {
        return i < conditions.length - 1;
      }
      return true;
    });

    const countSql = `SELECT COUNT(*)::int as total FROM vendors v WHERE ${countConditions.join(' AND ')}`;
    const countParams = cursorScore !== null ? params.slice(0, -2) : [...params];

    const countResult = await this.prisma.$queryRawUnsafe<[{ total: number }]>(
      countSql,
      ...countParams,
    );
    const total = countResult[0]?.total ?? 0;

    // Get ranked results
    params.push(limit + 1);
    const limitParamIndex = paramIndex;

    const sql = `
      SELECT v.*,
        (
          v.avg_rating * 0.5 +
          (LEAST(v.review_count, 50)::float / 50.0) * 0.3 +
          v.profile_complete_score * 0.1 +
          GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - v.updated_at)) / 31536000.0) * 0.1
        ) AS rank_score
      FROM vendors v
      WHERE ${whereClause}
      ORDER BY rank_score DESC, v.id ASC
      LIMIT $${limitParamIndex}
    `;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ score: lastItem.rank_score, id: lastItem.id }),
      ).toString('base64url');
    }

    return {
      vendors: items.map((row: any) => this.toVendorResponse(row)),
      nextCursor,
      total,
    };
  }

  private toVendorResponse(row: any): VendorResponse {
    return {
      id: row.id,
      slug: row.slug,
      businessName: row.business_name,
      category: row.category.toLowerCase() as any,
      description: row.description,
      area: row.area,
      address: row.address ?? undefined,
      priceFrom: row.price_from ? Number(row.price_from) : undefined,
      priceTo: row.price_to ? Number(row.price_to) : undefined,
      whatsappNumber: row.whatsapp_number ?? undefined,
      instagramHandle: row.instagram_handle ?? undefined,
      status: row.status.toLowerCase() as any,
      avgRating: row.avg_rating,
      reviewCount: row.review_count,
      profileCompleteScore: row.profile_complete_score,
      coverImageUrl: row.cover_image_url ?? undefined,
      userId: row.user_id,
      subscriptionTier: (row.subscription_tier ?? 'FREE').toLowerCase() as any,
      createdAt:
        row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updatedAt:
        row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  }

  async searchListings(query: SearchListingsQuery): Promise<SearchListingsResponse> {
    const limit = query.limit ?? 20;
    const conditions: string[] = [
      `l.deleted_at IS NULL`,
      `v.deleted_at IS NULL`,
      `v.status = 'ACTIVE'`,
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.listingType) {
      conditions.push(`l.listing_type = $${paramIndex}::listing_type`);
      params.push(query.listingType.toUpperCase());
      paramIndex++;
    }

    if (query.category) {
      conditions.push(`l.category = $${paramIndex}::vendor_category`);
      params.push(query.category.toUpperCase());
      paramIndex++;
    }

    if (query.rentalCategory) {
      conditions.push(`lrd.rental_category = $${paramIndex}::rental_category`);
      params.push(query.rentalCategory.toUpperCase());
      paramIndex++;
    }

    if (query.area) {
      conditions.push(`v.area = $${paramIndex}`);
      params.push(query.area);
      paramIndex++;
    }

    if (query.deliveryOption) {
      conditions.push(`lrd.delivery_option = $${paramIndex}::delivery_option`);
      params.push(query.deliveryOption.toUpperCase());
      paramIndex++;
    }

    if (query.q) {
      conditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`);
      params.push(`%${query.q}%`);
      paramIndex++;
    }

    // Price range filters — apply to service price_from/price_to OR rental price_per_day
    if (query.priceMin !== undefined) {
      conditions.push(`(COALESCE(l.price_from, lrd.price_per_day, 0) >= $${paramIndex})`);
      params.push(query.priceMin);
      paramIndex++;
    }

    if (query.priceMax !== undefined) {
      conditions.push(
        `(COALESCE(NULLIF(l.price_to, 0), l.price_from, lrd.price_per_day, 0) <= $${paramIndex})`,
      );
      params.push(query.priceMax);
      paramIndex++;
    }

    const rankExpression = `(
      v.avg_rating * 0.5 +
      (LEAST(v.review_count, 50)::float / 50.0) * 0.3 +
      v.profile_complete_score * 0.1 +
      GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - v.updated_at)) / 31536000.0) * 0.1
    )`;

    // Cursor pagination
    let cursorScore: number | null = null;
    let cursorId: string | null = null;
    if (query.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(query.cursor, 'base64url').toString());
        cursorScore = decoded.score;
        cursorId = decoded.id;
      } catch {
        // Invalid cursor, ignore
      }
    }

    if (cursorScore !== null && cursorId !== null) {
      conditions.push(
        `(${rankExpression} < $${paramIndex} OR (${rankExpression} = $${paramIndex} AND l.id > $${paramIndex + 1}::uuid))`,
      );
      params.push(cursorScore, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    // Total count (without cursor condition)
    const countConditions = conditions.filter((_, i) => {
      if (cursorScore !== null && cursorId !== null) {
        return i < conditions.length - 1;
      }
      return true;
    });

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM listings l
      INNER JOIN vendors v ON v.id = l.vendor_id
      LEFT JOIN listing_rental_details lrd ON lrd.listing_id = l.id
      WHERE ${countConditions.join(' AND ')}
    `;
    const countParams = cursorScore !== null ? params.slice(0, -2) : [...params];

    const countResult = await this.prisma.$queryRawUnsafe<[{ total: number }]>(
      countSql,
      ...countParams,
    );
    const total = countResult[0]?.total ?? 0;

    // Ranked results with embedded vendor + rental details
    params.push(limit + 1);
    const limitParamIndex = paramIndex;

    const sql = `
      SELECT
        l.id AS listing_id,
        l.vendor_id,
        l.listing_type,
        l.title AS listing_title,
        l.description AS listing_description,
        l.category AS listing_category,
        l.price_from AS listing_price_from,
        l.price_to AS listing_price_to,
        l.photos AS listing_photos,
        l.created_at AS listing_created_at,
        l.updated_at AS listing_updated_at,
        l.avg_rating AS listing_avg_rating,
        l.review_count AS listing_review_count,
        v.id AS v_id,
        v.slug AS v_slug,
        v.business_name AS v_business_name,
        v.avg_rating AS v_avg_rating,
        v.review_count AS v_review_count,
        v.area AS v_area,
        v.status AS v_status,
        lrd.rental_category,
        lrd.quantity_available,
        lrd.price_per_day,
        lrd.deposit_amount,
        lrd.delivery_option,
        lrd.condition,
        ${rankExpression} AS rank_score
      FROM listings l
      INNER JOIN vendors v ON v.id = l.vendor_id
      LEFT JOIN listing_rental_details lrd ON lrd.listing_id = l.id
      WHERE ${whereClause}
      ORDER BY rank_score DESC, l.id ASC
      LIMIT $${limitParamIndex}
    `;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ score: lastItem.rank_score, id: lastItem.listing_id }),
      ).toString('base64url');
    }

    return {
      listings: items.map((row: any) => this.toListingSearchResult(row)),
      nextCursor,
      total,
    };
  }

  private toListingSearchResult(row: any): ListingSearchResult {
    const vendor: ListingVendorSummary = {
      id: row.v_id,
      slug: row.v_slug,
      businessName: row.v_business_name,
      avgRating: row.v_avg_rating,
      reviewCount: row.v_review_count,
      area: row.v_area,
      verified: row.v_status === 'ACTIVE',
    };

    const result: ListingSearchResult = {
      id: row.listing_id,
      vendorId: row.vendor_id,
      listingType: row.listing_type.toLowerCase() as any,
      title: row.listing_title,
      description: row.listing_description,
      photos: row.listing_photos ?? [],
      avgRating: row.listing_avg_rating ?? 0,
      reviewCount: row.listing_review_count ?? 0,
      createdAt:
        row.listing_created_at instanceof Date
          ? row.listing_created_at.toISOString()
          : String(row.listing_created_at),
      updatedAt:
        row.listing_updated_at instanceof Date
          ? row.listing_updated_at.toISOString()
          : String(row.listing_updated_at),
      vendor,
    };

    if (row.listing_category) {
      result.category = row.listing_category.toLowerCase() as any;
    }
    if (row.listing_price_from !== null && row.listing_price_from !== undefined) {
      result.priceFrom = row.listing_price_from;
    }
    if (row.listing_price_to !== null && row.listing_price_to !== undefined) {
      result.priceTo = row.listing_price_to;
    }

    if (row.rental_category) {
      const rentalDetails: ListingRentalDetailsResponse = {
        rentalCategory: row.rental_category.toLowerCase() as any,
        quantityAvailable: row.quantity_available,
        pricePerDay: row.price_per_day,
        depositAmount: row.deposit_amount ?? undefined,
        deliveryOption: row.delivery_option.toLowerCase() as any,
        condition: row.condition ?? undefined,
      };
      result.rentalDetails = rentalDetails;
    }

    return result;
  }
}
