import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceOwnerGuard } from './guards/invoice-owner.guard';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createInvoiceSchema, updateInvoiceSchema } from '@eventtrust/shared';
import type { CreateInvoicePayload, UpdateInvoicePayload, AccessTokenPayload } from '@eventtrust/shared';

// ─── Vendor invoice management ────────────────────────────────────────────────

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createInvoiceSchema)) body: CreateInvoicePayload,
  ) {
    if (!user.vendorId) {
      throw new Error('Only vendors can create invoices');
    }
    const invoice = await this.invoicesService.create(user.vendorId, user.sub, body);
    return { data: invoice };
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const invoice = await this.invoicesService.findById(id, true);
    return { data: invoice };
  }

  @Patch(':id')
  @UseGuards(InvoiceOwnerGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) body: UpdateInvoicePayload,
  ) {
    const invoice = await this.invoicesService.update(id, user.sub, body);
    return { data: invoice };
  }

  @Post(':id/send')
  @UseGuards(InvoiceOwnerGuard)
  async send(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const invoice = await this.invoicesService.send(id, user.sub);
    return { data: invoice };
  }

  @Post(':id/confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  async confirm(@Param('id') id: string) {
    const invoice = await this.invoicesService.confirm(id);
    return { data: invoice };
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const invoice = await this.invoicesService.complete(id, user.sub, user.vendorId);
    return { data: invoice };
  }
}

// ─── Vendor-scoped invoice routes ─────────────────────────────────────────────

@Controller('vendors/:vendorId/invoices')
export class VendorInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(VendorOwnerGuard)
  async findByVendor(@Param('vendorId') vendorId: string) {
    const invoices = await this.invoicesService.findByVendor(vendorId);
    return { data: invoices };
  }

  @Get('funnel')
  @UseGuards(VendorOwnerGuard)
  async getFunnel(@Param('vendorId') vendorId: string) {
    const funnel = await this.invoicesService.getFunnel(vendorId);
    return { data: funnel };
  }
}

// ─── Client invoice routes ─────────────────────────────────────────────────────

@Controller('client/invoices')
export class ClientInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findByClient(@CurrentUser() user: AccessTokenPayload) {
    const invoices = await this.invoicesService.findByClient(user.sub);
    return { data: invoices };
  }
}
