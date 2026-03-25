import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InquiriesService } from '../inquiries/inquiries.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const mockPrisma = {
    vendor: {
      findFirst: vi.fn(),
    },
    inquiry: {
      findFirst: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    invoiceItem: {
      deleteMany: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockInquiries = {
    linkInvoice: vi.fn().mockResolvedValue(undefined),
    internalUpdateStatus: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeInvoice = (overrides?: any) => ({
    id: 'invoice-1',
    vendorId: 'vendor-1',
    clientId: null,
    invoiceNumber: 'ET-2026-0001',
    confirmToken: 'abc123token',
    status: 'DRAFT',
    clientName: 'Chukwuemeka Obi',
    clientPhone: '+2348012345678',
    clientEmail: null,
    eventDate: null,
    dueDate: null,
    eventLocation: null,
    notes: null,
    subtotalKobo: 200000,
    discountKobo: 0,
    totalKobo: 200000,
    sentAt: null,
    viewedAt: null,
    confirmedAt: null,
    completedAt: null,
    items: [
      {
        id: 'item-1',
        invoiceId: 'invoice-1',
        description: 'Catering for 100 guests',
        quantity: 1,
        unitPriceKobo: 200000,
        totalKobo: 200000,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const makeVendor = (overrides?: any) => ({
    id: 'vendor-1',
    businessName: 'Best Caterers Lagos',
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: InquiriesService, useValue: mockInquiries },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    const createPayload = {
      clientName: 'Chukwuemeka Obi',
      clientPhone: '+2348012345678',
      items: [{ description: 'Catering for 100 guests', quantity: 1, unitPriceKobo: 200000 }],
    };

    it('should create an invoice with generated invoice number', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(makeInvoice());

      const result = await service.create('vendor-1', 'user-1', createPayload);

      expect(result.id).toBe('invoice-1');
      expect(result.status).toBe('DRAFT');
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vendorId: 'vendor-1',
            clientName: 'Chukwuemeka Obi',
            subtotalKobo: 200000,
            totalKobo: 200000,
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice.created' }),
      );
    });

    it('should throw NotFoundException if vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.create('vendor-999', 'user-1', createPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should link to inquiry when inquiryId provided', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.inquiry.findFirst.mockResolvedValue({
        id: 'inquiry-1',
        vendorId: 'vendor-1',
        clientId: 'client-1',
      });
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue(makeInvoice({ clientId: 'client-1' }));

      await service.create('vendor-1', 'user-1', {
        ...createPayload,
        inquiryId: 'inquiry-1',
      });

      expect(mockInquiries.linkInvoice).toHaveBeenCalledWith('inquiry-1', 'invoice-1');
    });

    it('should reject if inquiry does not belong to vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.inquiry.findFirst.mockResolvedValue(null);

      await expect(
        service.create('vendor-1', 'user-1', { ...createPayload, inquiryId: 'inquiry-other' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply discount to total', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoice.count.mockResolvedValue(5);
      mockPrisma.invoice.create.mockResolvedValue(
        makeInvoice({ subtotalKobo: 200000, discountKobo: 20000, totalKobo: 180000 }),
      );

      const result = await service.create('vendor-1', 'user-1', {
        ...createPayload,
        discountKobo: 20000,
      });

      expect(result.totalKobo).toBe(180000);
    });
  });

  describe('findById', () => {
    it('should return invoice by id', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice());

      const result = await service.findById('invoice-1');

      expect(result.id).toBe('invoice-1');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findById('invoice-999')).rejects.toThrow(NotFoundException);
    });

    it('should mark invoice as viewed when status is SENT', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'SENT' }));
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: 'VIEWED' }));

      const result = await service.findById('invoice-1', true);

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'VIEWED' }),
        }),
      );
    });
  });

  describe('send', () => {
    it('should transition DRAFT → SENT', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: 'SENT' }));

      const result = await service.send('invoice-1', 'user-1');

      expect(result.status).toBe('SENT');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice.sent' }),
      );
    });

    it('should throw BadRequestException if invoice is already CONFIRMED', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'CONFIRMED' }));

      await expect(service.send('invoice-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.send('invoice-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('should confirm invoice with valid token from SENT status', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(
        makeInvoice({ status: 'SENT', inquiry: null }),
      );
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: 'CONFIRMED' }));

      const result = await service.confirm('invoice-1', 'abc123token');

      expect(result.status).toBe('CONFIRMED');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice.confirmed' }),
      );
    });

    it('should throw UnauthorizedException for wrong token', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'SENT' }));

      await expect(service.confirm('invoice-1', 'wrong-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if invoice is still DRAFT', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await expect(service.confirm('invoice-1', 'abc123token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update linked inquiry to BOOKED on confirm', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(
        makeInvoice({ status: 'SENT', inquiry: { id: 'inquiry-1' } }),
      );
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: 'CONFIRMED' }));

      await service.confirm('invoice-1', 'abc123token');

      expect(mockInquiries.internalUpdateStatus).toHaveBeenCalledWith('inquiry-1', 'BOOKED');
    });
  });

  describe('complete', () => {
    it('should complete a CONFIRMED invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'CONFIRMED' }));
      mockPrisma.invoice.update.mockResolvedValue(makeInvoice({ status: 'COMPLETED' }));

      const result = await service.complete('invoice-1', 'user-1', 'vendor-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw if trying to complete a DRAFT invoice', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));

      await expect(service.complete('invoice-1', 'user-1', 'vendor-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate a padded invoice number', async () => {
      mockPrisma.invoice.count.mockResolvedValue(42);

      const number = await service.generateInvoiceNumber();
      const year = new Date().getFullYear();

      expect(number).toBe(`EVT-${year}-0043`);
    });
  });
});
