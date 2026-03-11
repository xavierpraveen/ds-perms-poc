import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { DataService } from './data.service';
import { RequestLoggerInterceptor } from '../common/interceptors/request-logger.interceptor';
import { ApiKey } from '@prisma/client';

// Extend Request to include apiKey
interface AuthedRequest extends Request {
  apiKey: ApiKey;
}

@UseGuards(ApiKeyGuard)
@UseInterceptors(RequestLoggerInterceptor)
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get(':slug')
  listRecords(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.dataService.listRecords(req.apiKey, slug, limit ? +limit : 20, offset ? +offset : 0);
  }

  @Get(':slug/:id')
  getRecord(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.dataService.getRecord(req.apiKey, slug, id);
  }

  @Post(':slug')
  createRecord(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.dataService.createRecord(req.apiKey, slug, data);
  }

  @Patch(':slug/:id')
  updateRecord(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.dataService.updateRecord(req.apiKey, slug, id, data);
  }

  @Delete(':slug/:id')
  deleteRecord(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.dataService.deleteRecord(req.apiKey, slug, id);
  }
}
