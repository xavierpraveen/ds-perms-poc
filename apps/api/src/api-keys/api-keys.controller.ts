import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto, AssignPermissionsDto } from './dto/api-key.dto';

@UseGuards(ClerkGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  findAll(@CurrentUser() userId: string) {
    return this.apiKeysService.findAll(userId);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.apiKeysService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() userId: string, @Body() dto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.apiKeysService.remove(id, userId);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.apiKeysService.getPermissions(id, userId);
  }

  @Put(':id/permissions')
  assignPermissions(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.apiKeysService.assignPermissions(id, userId, dto);
  }

  @Get(':id/sparkline')
  getSparkline(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.apiKeysService.getSparkline(id, userId);
  }
}
