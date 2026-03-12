import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { searchVendorsSchema } from '@eventtrust/shared';
import type { SearchVendorsQuery } from '@eventtrust/shared';

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
}
