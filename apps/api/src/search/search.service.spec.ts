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

  const makeListingRow = (overrides?: any) => ({
    listing_id: 'listing-1',
    vendor_id: 'vendor-1',
    listing_type: 'SERVICE',
    listing_title: 'Premium Catering Package',
    listing_description: 'Full catering for events up to 500 guests',
    listing_category: 'CATERER',
    listing_price_from: 50000,
    listing_price_to: 200000,
    listing_photos: ['photo1.jpg', 'photo2.jpg'],
    listing_created_at: now,
    listing_updated_at: now,
    v_id: 'vendor-1',
    v_slug: 'best-caterers-lagos',
    v_business_name: 'Best Caterers Lagos',
    v_avg_rating: 4.5,
    v_review_count: 20,
    v_area: 'Lekki',
    v_status: 'ACTIVE',
    rental_category: null,
    quantity_available: null,
    price_per_day: null,
    deposit_amount: null,
    delivery_option: null,
    condition: null,
    rank_score: 3.71,
    ...overrides,
  });

  const makeRentalListingRow = (overrides?: any) => ({
    ...makeListingRow({
      listing_id: 'listing-2',
      listing_type: 'RENTAL',
      listing_title: '100-Seater Party Tent',
      listing_description: 'Large white marquee tent for outdoor events',
      listing_category: null,
      listing_price_from: null,
      listing_price_to: null,
      rental_category: 'TENT',
      quantity_available: 5,
      price_per_day: 25000,
      deposit_amount: 10000,
      delivery_option: 'BOTH',
      condition: 'Excellent',
      ...overrides,
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SearchService>(SearchService);
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should return ranked results in correct order', async () => {
      const row1 = makeVendorRow({ id: 'v1', rank_score: 4.0 });
      const row2 = makeVendorRow({ id: 'v2', rank_score: 3.5 });

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 2 }]) // count
        .mockResolvedValueOnce([row1, row2]); // results

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
      const cursor = Buffer.from(JSON.stringify({ score: 3.5, id: 'v1' })).toString('base64url');

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

      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 10 }]).mockResolvedValueOnce(rows);

      const result = await service.search({ limit: 2 });

      expect(result.vendors).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();

      // Verify cursor is decodable
      const decoded = JSON.parse(Buffer.from(result.nextCursor!, 'base64url').toString());
      expect(decoded.score).toBeDefined();
      expect(decoded.id).toBe('v1');
    });

    it('should return empty results when no vendors match', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

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
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

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
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      const result = await service.search({ cursor: 'invalid-base64' });

      expect(result.vendors).toEqual([]);
    });

    it('should filter vendors by listingType', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({ listingType: 'rental' as any });

      expect(result.vendors).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('listing_type');
      expect(countCall[0]).toContain('EXISTS');
      expect(countCall[1]).toBe('RENTAL');
    });

    it('should filter vendors by rentalCategory', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeVendorRow()]);

      const result = await service.search({ rentalCategory: 'generator' as any });

      expect(result.vendors).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('rental_category');
      expect(countCall[0]).toContain('EXISTS');
      expect(countCall[1]).toBe('GENERATOR');
    });
  });

  describe('searchListings', () => {
    it('should return ranked listing results', async () => {
      const row1 = makeListingRow({ listing_id: 'l1', rank_score: 4.0 });
      const row2 = makeListingRow({ listing_id: 'l2', rank_score: 3.5 });

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce([row1, row2]);

      const result = await service.searchListings({});

      expect(result.listings).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should filter by listingType', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({ listingType: 'service' as any });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('listing_type');
      expect(countCall[1]).toBe('SERVICE');
    });

    it('should filter by category', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({ category: 'caterer' as any });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('l.category');
      expect(countCall[1]).toBe('CATERER');
    });

    it('should filter by rentalCategory', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeRentalListingRow()]);

      const result = await service.searchListings({ rentalCategory: 'tent' as any });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('rental_category');
      expect(countCall[1]).toBe('TENT');
    });

    it('should filter by area', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({ area: 'Lekki' });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('v.area');
      expect(countCall[1]).toBe('Lekki');
    });

    it('should filter by deliveryOption', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeRentalListingRow()]);

      const result = await service.searchListings({ deliveryOption: 'both' as any });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('delivery_option');
      expect(countCall[1]).toBe('BOTH');
    });

    it('should search by keyword in listing title and description', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({ q: 'catering' });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('ILIKE');
      expect(countCall[1]).toBe('%catering%');
    });

    it('should filter by price range', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({ priceMin: 10000, priceMax: 100000 });

      expect(result.listings).toHaveLength(1);
      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0]!;
      expect(countCall[0]).toContain('COALESCE');
      expect(countCall[1]).toBe(10000);
      expect(countCall[2]).toBe(100000);
    });

    it('should handle cursor pagination', async () => {
      const cursor = Buffer.from(JSON.stringify({ score: 3.5, id: 'l1' })).toString('base64url');

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([makeListingRow({ listing_id: 'l2', rank_score: 3.0 })]);

      const result = await service.searchListings({ cursor, limit: 20 });

      expect(result.listings).toHaveLength(1);
    });

    it('should return nextCursor when more results exist', async () => {
      const rows = Array.from({ length: 3 }, (_, i) =>
        makeListingRow({ listing_id: `l${i}`, rank_score: 4.0 - i * 0.1 }),
      );

      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 10 }]).mockResolvedValueOnce(rows);

      const result = await service.searchListings({ limit: 2 });

      expect(result.listings).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();

      const decoded = JSON.parse(Buffer.from(result.nextCursor!, 'base64url').toString());
      expect(decoded.score).toBeDefined();
      expect(decoded.id).toBe('l1');
    });

    it('should return empty results when no listings match', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      const result = await service.searchListings({ q: 'nonexistent' });

      expect(result.listings).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should only return listings from ACTIVE vendors', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      await service.searchListings({});

      const resultCall = mockPrisma.$queryRawUnsafe.mock.calls[1]!;
      expect(resultCall[0]).toContain(`v.status = 'ACTIVE'`);
    });

    it('should exclude deleted listings', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      await service.searchListings({});

      const resultCall = mockPrisma.$queryRawUnsafe.mock.calls[1]!;
      expect(resultCall[0]).toContain('l.deleted_at IS NULL');
    });

    it('should exclude deleted vendors', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      await service.searchListings({});

      const resultCall = mockPrisma.$queryRawUnsafe.mock.calls[1]!;
      expect(resultCall[0]).toContain('v.deleted_at IS NULL');
    });

    it('should transform service listing row correctly', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeListingRow()]);

      const result = await service.searchListings({});

      const listing = result.listings[0]!;
      expect(listing.id).toBe('listing-1');
      expect(listing.listingType).toBe('service');
      expect(listing.title).toBe('Premium Catering Package');
      expect(listing.category).toBe('caterer');
      expect(listing.priceFrom).toBe(50000);
      expect(listing.priceTo).toBe(200000);
      expect(listing.photos).toEqual(['photo1.jpg', 'photo2.jpg']);
      expect(listing.rentalDetails).toBeUndefined();

      expect(listing.vendor.id).toBe('vendor-1');
      expect(listing.vendor.slug).toBe('best-caterers-lagos');
      expect(listing.vendor.businessName).toBe('Best Caterers Lagos');
      expect(listing.vendor.avgRating).toBe(4.5);
      expect(listing.vendor.reviewCount).toBe(20);
      expect(listing.vendor.area).toBe('Lekki');
      expect(listing.vendor.verified).toBe(true);
    });

    it('should transform rental listing row correctly', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([makeRentalListingRow()]);

      const result = await service.searchListings({});

      const listing = result.listings[0]!;
      expect(listing.id).toBe('listing-2');
      expect(listing.listingType).toBe('rental');
      expect(listing.title).toBe('100-Seater Party Tent');
      expect(listing.category).toBeUndefined();
      expect(listing.priceFrom).toBeUndefined();

      expect(listing.rentalDetails).toBeDefined();
      expect(listing.rentalDetails!.rentalCategory).toBe('tent');
      expect(listing.rentalDetails!.quantityAvailable).toBe(5);
      expect(listing.rentalDetails!.pricePerDay).toBe(25000);
      expect(listing.rentalDetails!.depositAmount).toBe(10000);
      expect(listing.rentalDetails!.deliveryOption).toBe('both');
      expect(listing.rentalDetails!.condition).toBe('Excellent');
    });

    it('should handle invalid cursor gracefully', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      const result = await service.searchListings({ cursor: 'invalid-base64' });

      expect(result.listings).toEqual([]);
    });
  });
});
