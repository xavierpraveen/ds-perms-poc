import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto, CreateModuleFieldDto } from './dto/create-module.dto';
import { UpdateModuleDto, UpdateModuleFieldDto } from './dto/update-module.dto';
import { Environment } from '@dmds/types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, environment?: Environment) {
    return this.prisma.module.findMany({
      where: {
        userId,
        ...(environment && { environment }),
      },
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const module = await this.prisma.module.findFirst({
      where: { id, userId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async findBySlug(slug: string, userId: string) {
    const module = await this.prisma.module.findFirst({
      where: { slug, userId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!module) throw new NotFoundException(`Module '${slug}' not found`);
    return module;
  }

  async create(userId: string, dto: CreateModuleDto) {
    let slug = dto.slug || toSlug(dto.name);

    // Handle slug collision with suffix
    const existing = await this.prisma.module.findFirst({ where: { userId, slug } });
    if (existing) {
      const count = await this.prisma.module.count({ where: { userId, slug: { startsWith: slug } } });
      slug = `${slug}-${count}`;
    }

    return this.prisma.module.create({
      data: {
        userId,
        name: dto.name,
        slug,
        description: dto.description,
        environment: dto.environment,
        fields: dto.fields
          ? {
              create: dto.fields.map((f, i) => ({
                name: f.name,
                type: f.type,
                required: f.required ?? false,
                sensitive: f.sensitive ?? false,
                description: f.description,
                order: f.order ?? i,
              })),
            }
          : undefined,
      },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, userId: string, dto: UpdateModuleDto) {
    await this.findOne(id, userId);
    return this.prisma.module.update({
      where: { id },
      data: dto,
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.module.delete({ where: { id } });
  }

  // ─── Fields ───────────────────────────────────────────────────────────────

  async addField(moduleId: string, userId: string, dto: CreateModuleFieldDto) {
    await this.findOne(moduleId, userId);
    const count = await this.prisma.moduleField.count({ where: { moduleId } });
    return this.prisma.moduleField.create({
      data: {
        moduleId,
        name: dto.name,
        type: dto.type,
        required: dto.required ?? false,
        sensitive: dto.sensitive ?? false,
        description: dto.description,
        order: dto.order ?? count,
      },
    });
  }

  async updateField(moduleId: string, fieldId: string, userId: string, dto: UpdateModuleFieldDto) {
    await this.findOne(moduleId, userId);
    const field = await this.prisma.moduleField.findFirst({ where: { id: fieldId, moduleId } });
    if (!field) throw new NotFoundException('Field not found');
    return this.prisma.moduleField.update({ where: { id: fieldId }, data: dto });
  }

  async removeField(moduleId: string, fieldId: string, userId: string) {
    await this.findOne(moduleId, userId);
    const field = await this.prisma.moduleField.findFirst({ where: { id: fieldId, moduleId } });
    if (!field) throw new NotFoundException('Field not found');
    return this.prisma.moduleField.delete({ where: { id: fieldId } });
  }

  async reorderFields(moduleId: string, userId: string, fieldIds: string[]) {
    await this.findOne(moduleId, userId);
    await this.prisma.$transaction(
      fieldIds.map((id, index) =>
        this.prisma.moduleField.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.prisma.moduleField.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }
}
