import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SearchVendorsQuery, SearchVendorsResponse, VendorResponse } from '@eventtrust/shared';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchVendorsQuery): Promise<SearchVendorsResponse> {
    const limit = query.limit ?? 20;
    const conditions: string[] = [
      `v.deleted_at IS NULL`,
      `v.status = 'ACTIVE'`,
    ];
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
      createdAt: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
      updatedAt: row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
    };
  }
}
