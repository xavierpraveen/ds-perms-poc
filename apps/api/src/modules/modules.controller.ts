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
  findAll(@Query('environment') environment?: Environment) {
    return this.modulesService.findAll(environment);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateModuleDto) {
    return this.modulesService.create(userId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }

  // ─── Field routes ─────────────────────────────────────────────────────────

  @Post(':id/fields')
  addField(
    @Param('id') moduleId: string,
    @Body() dto: CreateModuleFieldDto,
  ) {
    return this.modulesService.addField(moduleId, dto);
  }

  @Patch(':id/fields/:fieldId')
  updateField(
    @Param('id') moduleId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateModuleFieldDto,
  ) {
    return this.modulesService.updateField(moduleId, fieldId, dto);
  }

  @Delete(':id/fields/:fieldId')
  removeField(
    @Param('id') moduleId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.modulesService.removeField(moduleId, fieldId);
  }

  @Put(':id/fields/reorder')
  reorderFields(
    @Param('id') moduleId: string,
    @Body() dto: ReorderFieldsDto,
  ) {
    return this.modulesService.reorderFields(moduleId, dto.fieldIds);
  }
}
