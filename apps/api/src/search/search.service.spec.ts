import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;

  const mockPrisma = {
    $queryRawUnsafe: vi.fn(),
  };

  const now = new Date();

  const makeVendorRow = (overrides?: any) => ({
    id: 'vendor-1',
    slug: 'best-caterers-lagos',
    business_name: 'Best Caterers Lagos',
    category: 'CATERER',
    description: 'Premium catering services for events in Lagos',
    area: 'Lekki',
    address: '123 Lekki Phase 1',
    price_from: 50000,
    price_to: 200000,
    whatsapp_number: '+2348012345678',
    instagram_handle: '@bestcaterers',
    cover_image_url: null,
    status: 'ACTIVE',
    avg_rating: 4.5,
    review_count: 20,
    profile_complete_score: 0.8,
    user_id: 'user-1',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    rank_score: 3.71,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should return ranked results in correct order', async () => {
      const row1 = makeVendorRow({ id: 'v1', rank_score: 4.0 });
      const row2 = makeVendorRow({ id: 'v2', rank_score: 3.5 });

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 2 }])  // count
        .mockResolvedValueOnce([row1, row2]);     // results

      const result = await service.search({});

      expect(result.vendors).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should filter by category', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({ category: 'caterer' as any });

      expect(result.vendors).toHaveLength(1);
      // Verify the SQL includes category filter
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('category');
      expect(countCall[1]).toBe('CATERER');
    });

    it('should filter by area', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({ area: 'Lekki' });

      expect(result.vendors).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('area');
      expect(countCall[1]).toBe('Lekki');
    });

    it('should search by keyword in business name and description', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({ q: 'caterer' });

      expect(result.vendors).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('ILIKE');
      expect(countCall[1]).toBe('%caterer%');
    });

    it('should handle cursor pagination', async () => {
      const cursor = Buffer.from(
        JSON.stringify({ score: 3.5, id: 'v1' }),
      ).toString('base64url');

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([makeVendorRow({ id: 'v2', rank_score: 3.0 })]);

      const result = await service.search({ cursor, limit: 20 });

      expect(result.vendors).toHaveLength(1);
    });

    it('should return nextCursor when more results exist', async () => {
      const rows = Array.from({ length: 3 }, (_, i) =>
        makeVendorRow({ id: `v${i}`, rank_score: 4.0 - i * 0.1 }),
      );

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce(rows);

      const result = await service.search({ limit: 2 });

      expect(result.vendors).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();

      // Verify cursor is decodable
      const decoded = JSON.parse(
        Buffer.from(result.nextCursor!, 'base64url').toString(),
      );
      expect(decoded.score).toBeDefined();
      expect(decoded.id).toBe('v1');
    });

    it('should return empty results when no vendors match', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.search({ q: 'nonexistent' });

      expect(result.vendors).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should only return ACTIVE vendors', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      await service.search({});

      // Verify SQL includes status = 'ACTIVE'
      const resultCall = mockPrisma.$queryRawUnsafe.mock.calls[1]!;
      expect(resultCall[0]).toContain(`status = 'ACTIVE'`);
    });

    it('should exclude deleted vendors', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await service.search({});

      const resultCall = mockPrisma.$queryRawUnsafe.mock.calls[1]!;
      expect(resultCall[0]).toContain('deleted_at IS NULL');
    });

    it('should convert row to VendorResponse correctly', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({});

      const vendor = result.vendors[0]!;
      expect(vendor.businessName).toBe('Best Caterers Lagos');
      expect(vendor.category).toBe('caterer');
      expect(vendor.status).toBe('active');
      expect(vendor.area).toBe('Lekki');
      expect(vendor.avgRating).toBe(4.5);
    });

    it('should handle invalid cursor gracefully', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await service.search({ cursor: 'invalid-base64' });

      expect(result.vendors).toEqual([]);
    });
  });
});
