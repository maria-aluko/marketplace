import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { searchVendorsSchema, searchListingsSchema } from '@eventtrust/shared';
import type { SearchVendorsQuery, SearchListingsQuery } from '@eventtrust/shared';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('vendors')
  async searchVendors(
    @Query(new ZodValidationPipe(searchVendorsSchema)) query: SearchVendorsQuery,
  ) {
    return this.searchService.search(query);
  }

  @Public()
  @Get('listings')
  async searchListings(
    @Query(new ZodValidationPipe(searchListingsSchema)) query: SearchListingsQuery,
  ) {
    return this.searchService.searchListings(query);
  }
}
