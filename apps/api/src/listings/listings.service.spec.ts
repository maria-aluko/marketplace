import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ListingsService', () => {
  let service: ListingsService;

  const mockPrisma = {
    vendor: {
      findFirst: vi.fn(),
    },
    listing: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    listingRentalDetails: {
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeServiceListing = (overrides?: any) => ({
    id: 'listing-1',
    vendorId: 'vendor-1',
    listingType: 'SERVICE',
    title: 'Premium Catering',
    description: 'Full-service catering for events in Lagos.',
    category: 'CATERER',
    priceFrom: 50000,
    priceTo: 200000,
    photos: [],
    rentalDetails: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });

  const makeRentalListing = (overrides?: any) => ({
    id: 'listing-2',
    vendorId: 'vendor-1',
    listingType: 'RENTAL',
    title: 'Party Tent Rental',
    description: 'Large marquee tents for outdoor events.',
    category: null,
    priceFrom: null,
    priceTo: null,
    photos: ['img_tent1'],
    rentalDetails: {
      id: 'rd-1',
      listingId: 'listing-2',
      rentalCategory: 'TENT',
      quantityAvailable: 10,
      pricePerDay: 15000,
      depositAmount: 5000,
      deliveryOption: 'BOTH',
      condition: 'Like new',
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    vi.clearAllMocks();
  });

  describe('createServiceListing', () => {
    it('should create a service listing for an active vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ status: 'ACTIVE' });
      const listing = makeServiceListing();
      mockPrisma.listing.create.mockResolvedValue(listing);

      const result = await service.createServiceListing('vendor-1', 'user-1', {
        title: 'Premium Catering',
        description: 'Full-service catering for events in Lagos.',
        category: 'caterer' as any,
        priceFrom: 50000,
        priceTo: 200000,
      });

      expect(result.id).toBe('listing-1');
      expect(result.listingType).toBe('service');
      expect(result.category).toBe('caterer');
      expect(mockPrisma.listing.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'listing.created',
          actorId: 'user-1',
          targetType: 'Listing',
          targetId: 'listing-1',
        }),
      );
    });

    it('should throw ForbiddenException if vendor is not active', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ status: 'DRAFT' });

      await expect(
        service.createServiceListing('vendor-1', 'user-1', {
          title: 'Premium Catering',
          description: 'Full-service catering for events in Lagos.',
          category: 'caterer' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vendor does not exist', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.createServiceListing('vendor-1', 'user-1', {
          title: 'Premium Catering',
          description: 'Full-service catering for events in Lagos.',
          category: 'caterer' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRentalListing', () => {
    it('should create a rental listing with details in a transaction', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ status: 'ACTIVE' });
      const listing = { ...makeRentalListing(), rentalDetails: undefined };
      const rentalDetails = makeRentalListing().rentalDetails;
      mockPrisma.listing.create.mockResolvedValue(listing);
      mockPrisma.listingRentalDetails.create.mockResolvedValue(rentalDetails);

      const result = await service.createRentalListing('vendor-1', 'user-1', {
        title: 'Party Tent Rental',
        description: 'Large marquee tents for outdoor events.',
        rentalCategory: 'tent' as any,
        quantityAvailable: 10,
        pricePerDay: 15000,
        depositAmount: 5000,
        deliveryOption: 'both' as any,
        condition: 'Like new',
      });

      expect(result.id).toBe('listing-2');
      expect(result.listingType).toBe('rental');
      expect(result.rentalDetails).toBeDefined();
      expect(result.rentalDetails!.rentalCategory).toBe('tent');
      expect(result.rentalDetails!.quantityAvailable).toBe(10);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'listing.created',
          metadata: expect.objectContaining({ listingType: 'RENTAL' }),
        }),
      );
    });

    it('should throw ForbiddenException if vendor is not active', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ status: 'PENDING' });

      await expect(
        service.createRentalListing('vendor-1', 'user-1', {
          title: 'Party Tent Rental',
          description: 'Large marquee tents for outdoor events.',
          rentalCategory: 'tent' as any,
          quantityAvailable: 10,
          pricePerDay: 15000,
          deliveryOption: 'both' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update service listing fields', async () => {
      const listing = makeServiceListing();
      mockPrisma.listing.findFirst.mockResolvedValue(listing);
      mockPrisma.listing.update.mockResolvedValue({
        ...listing,
        title: 'Updated Title',
        rentalDetails: null,
      });

      const result = await service.update('listing-1', 'user-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'listing.updated' }),
      );
    });

    it('should update rental listing with details in a transaction', async () => {
      const listing = makeRentalListing();
      mockPrisma.listing.findFirst
        .mockResolvedValueOnce(listing)
        .mockResolvedValueOnce({ ...listing, rentalDetails: { ...listing.rentalDetails, quantityAvailable: 20 } });
      mockPrisma.listing.update.mockResolvedValue(listing);
      mockPrisma.listingRentalDetails.update.mockResolvedValue({
        ...listing.rentalDetails,
        quantityAvailable: 20,
      });

      const result = await service.update('listing-2', 'user-1', {
        quantityAvailable: 20,
      } as any);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(
        service.update('listing-999', 'user-1', { title: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt and log audit', async () => {
      const listing = makeServiceListing();
      mockPrisma.listing.findFirst.mockResolvedValue(listing);
      mockPrisma.listing.update.mockResolvedValue({ ...listing, deletedAt: now });

      await service.softDelete('listing-1', 'user-1');

      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'listing.deleted' }),
      );
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('listing-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return listing with rental details', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(makeRentalListing());

      const result = await service.findById('listing-2');

      expect(result).not.toBeNull();
      expect(result!.rentalDetails).toBeDefined();
      expect(result!.rentalDetails!.pricePerDay).toBe(15000);
    });

    it('should return null for deleted listing', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      const result = await service.findById('listing-deleted');

      expect(result).toBeNull();
    });
  });

  describe('findByVendorId', () => {
    it('should return all listings for a vendor', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([
        makeServiceListing(),
        makeRentalListing(),
      ]);

      const results = await service.findByVendorId('vendor-1');

      expect(results).toHaveLength(2);
      expect(results[0].listingType).toBe('service');
      expect(results[1].listingType).toBe('rental');
    });

    it('should return empty array when vendor has no listings', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([]);

      const results = await service.findByVendorId('vendor-999');

      expect(results).toEqual([]);
    });
  });
});
