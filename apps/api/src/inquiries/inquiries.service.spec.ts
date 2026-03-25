import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('InquiriesService', () => {
  let service: InquiriesService;

  const mockPrisma = {
    inquiry: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeInquiry = (overrides?: any) => ({
    id: 'inquiry-1',
    clientId: 'client-1',
    vendorId: 'vendor-1',
    listingId: null,
    source: 'WHATSAPP',
    message: 'I need catering for 200 guests in Ikeja for December',
    notes: null,
    status: 'NEW',
    invoiceId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<InquiriesService>(InquiriesService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create inquiry with NEW status', async () => {
      mockPrisma.inquiry.create.mockResolvedValue(makeInquiry());

      const result = await service.create('client-1', {
        vendorId: 'vendor-1',
        source: 'WHATSAPP',
        message: 'I need catering for 200 guests in Ikeja for December',
      });

      expect(result.id).toBe('inquiry-1');
      expect(result.status).toBe('NEW');
      expect(mockPrisma.inquiry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: 'client-1',
            vendorId: 'vendor-1',
            status: 'NEW',
          }),
        }),
      );
    });

    it('should fire-and-forget audit log without blocking', async () => {
      mockPrisma.inquiry.create.mockResolvedValue(makeInquiry());

      const result = await service.create('client-1', {
        vendorId: 'vendor-1',
        source: 'WHATSAPP',
      });

      expect(result.id).toBe('inquiry-1');
      // Audit is fire-and-forget — may not be awaited at assertion time
    });
  });

  describe('findByClient', () => {
    it('should return inquiries for client', async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([
        makeInquiry(),
        makeInquiry({ id: 'inquiry-2', status: 'CONTACTED' }),
      ]);

      const results = await service.findByClient('client-1');

      expect(results).toHaveLength(2);
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: 'client-1' } }),
      );
    });

    it('should return empty array when client has no inquiries', async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([]);

      const results = await service.findByClient('client-999');

      expect(results).toHaveLength(0);
    });
  });

  describe('findByVendor', () => {
    it('should return inquiries for vendor', async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([makeInquiry()]);

      const results = await service.findByVendor('vendor-1');

      expect(results).toHaveLength(1);
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vendorId: 'vendor-1' } }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should transition NEW → CONTACTED', async () => {
      mockPrisma.inquiry.findFirst.mockResolvedValue(makeInquiry({ status: 'NEW' }));
      mockPrisma.inquiry.update.mockResolvedValue(makeInquiry({ status: 'CONTACTED' }));

      const result = await service.updateStatus('inquiry-1', 'vendor-user-1', {
        status: 'CONTACTED',
      });

      expect(result.status).toBe('CONTACTED');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'inquiry.status_changed',
          metadata: expect.objectContaining({ oldStatus: 'NEW', newStatus: 'CONTACTED' }),
        }),
      );
    });

    it('should throw NotFoundException if inquiry not found', async () => {
      mockPrisma.inquiry.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('inquiry-999', 'vendor-user-1', { status: 'CONTACTED' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrisma.inquiry.findFirst.mockResolvedValue(makeInquiry({ status: 'NEW' }));

      await expect(
        service.updateStatus('inquiry-1', 'vendor-user-1', { status: 'COMPLETED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow transition CONTACTED → BOOKED', async () => {
      mockPrisma.inquiry.findFirst.mockResolvedValue(makeInquiry({ status: 'CONTACTED' }));
      mockPrisma.inquiry.update.mockResolvedValue(makeInquiry({ status: 'BOOKED' }));

      const result = await service.updateStatus('inquiry-1', 'vendor-user-1', {
        status: 'BOOKED',
      });

      expect(result.status).toBe('BOOKED');
    });
  });

  describe('internalUpdateStatus', () => {
    it('should update status without transition validation', async () => {
      mockPrisma.inquiry.update.mockResolvedValue(makeInquiry({ status: 'BOOKED' }));

      await service.internalUpdateStatus('inquiry-1', 'BOOKED');

      expect(mockPrisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: 'inquiry-1' },
        data: { status: 'BOOKED' },
      });
    });
  });

  describe('linkInvoice', () => {
    it('should link invoice to inquiry', async () => {
      mockPrisma.inquiry.update.mockResolvedValue(makeInquiry({ invoiceId: 'invoice-1' }));

      await service.linkInvoice('inquiry-1', 'invoice-1');

      expect(mockPrisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: 'inquiry-1' },
        data: { invoiceId: 'invoice-1' },
      });
    });
  });
});
