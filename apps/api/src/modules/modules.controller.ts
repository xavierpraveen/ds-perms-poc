import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ModulesService } from './modules.service';
import { CreateModuleDto, CreateModuleFieldDto } from './dto/create-module.dto';
import { UpdateModuleDto, UpdateModuleFieldDto, ReorderFieldsDto } from './dto/update-module.dto';
import { Environment } from '@dmds/types';

@UseGuards(ClerkGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll(@CurrentUser() userId: string, @Query('environment') environment?: Environment) {
    return this.modulesService.findAll(userId, environment);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.modulesService.findOne(id, userId);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateModuleDto) {
    return this.modulesService.create(userId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() userId: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.modulesService.remove(id, userId);
  }

  // ─── Field routes ─────────────────────────────────────────────────────────

  @Post(':id/fields')
  addField(
    @Param('id') moduleId: string,
    @CurrentUser() userId: string,
    @Body() dto: CreateModuleFieldDto,
  ) {
    return this.modulesService.addField(moduleId, userId, dto);
  }

  @Patch(':id/fields/:fieldId')
  updateField(
    @Param('id') moduleId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateModuleFieldDto,
  ) {
    return this.modulesService.updateField(moduleId, fieldId, userId, dto);
  }

  @Delete(':id/fields/:fieldId')
  removeField(
    @Param('id') moduleId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() userId: string,
  ) {
    return this.modulesService.removeField(moduleId, fieldId, userId);
  }

  @Put(':id/fields/reorder')
  reorderFields(
    @Param('id') moduleId: string,
    @CurrentUser() userId: string,
    @Body() dto: ReorderFieldsDto,
  ) {
    return this.modulesService.reorderFields(moduleId, userId, dto.fieldIds);
  }
}
