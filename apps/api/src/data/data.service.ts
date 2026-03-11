import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKey } from '@prisma/client';

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveModule(slug: string, userId: string) {
    const module = await this.prisma.module.findFirst({
      where: { slug, userId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!module) throw new NotFoundException(`Module '${slug}' not found`);
    return module;
  }

  private async getPermissions(apiKeyId: string, moduleId: string) {
    const modulePerm = await this.prisma.apiKeyModulePermission.findUnique({
      where: { apiKeyId_moduleId: { apiKeyId, moduleId } },
    });
    const fieldPerms = await this.prisma.apiKeyFieldPermission.findMany({
      where: { apiKeyId },
      include: { moduleField: true },
    });
    return { modulePerm, fieldPerms };
  }

  private filterRecord(
    record: Record<string, unknown>,
    allowedFieldNames: Set<string>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(record).filter(([key]) => allowedFieldNames.has(key)),
    );
  }

  private buildAllowedFieldNames(
    fields: Array<{ id: string; name: string }>,
    fieldPerms: Array<{ allowed: boolean; moduleField: { id: string; name: string } }>,
    moduleFieldIds: Set<string>,
  ): { allowed: Set<string>; stripped: string[] } {
    const allowedFieldPerms = new Set(
      fieldPerms.filter((fp) => fp.allowed).map((fp) => fp.moduleField.id),
    );

    const allowed = new Set<string>();
    const stripped: string[] = [];

    for (const field of fields) {
      if (moduleFieldIds.has(field.id) && allowedFieldPerms.has(field.id)) {
        allowed.add(field.name);
      } else if (moduleFieldIds.has(field.id)) {
        stripped.push(field.name);
      }
    }

    return { allowed, stripped };
  }

  async listRecords(apiKey: ApiKey, slug: string, limit = 20, offset = 0) {
    const module = await this.resolveModule(slug, apiKey.userId);
    const { modulePerm, fieldPerms } = await this.getPermissions(apiKey.id, module.id);

    if (!modulePerm?.canRead) {
      throw new ForbiddenException(`API key does not have read permission for module '${slug}'`);
    }

    const moduleFieldIds = new Set(module.fields.map((f) => f.id));
    const { allowed, stripped } = this.buildAllowedFieldNames(module.fields, fieldPerms, moduleFieldIds);

    const [records, total] = await Promise.all([
      this.prisma.moduleRecord.findMany({
        where: { moduleId: module.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.moduleRecord.count({ where: { moduleId: module.id } }),
    ]);

    const filtered = records.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      ...this.filterRecord(r.data as Record<string, unknown>, allowed),
    }));

    return {
      data: filtered,
      total,
      limit,
      offset,
      strippedFields: stripped.length > 0 ? stripped : undefined,
    };
  }

  async getRecord(apiKey: ApiKey, slug: string, recordId: string) {
    const module = await this.resolveModule(slug, apiKey.userId);
    const { modulePerm, fieldPerms } = await this.getPermissions(apiKey.id, module.id);

    if (!modulePerm?.canRead) {
      throw new ForbiddenException(`API key does not have read permission for module '${slug}'`);
    }

    const record = await this.prisma.moduleRecord.findFirst({
      where: { id: recordId, moduleId: module.id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const moduleFieldIds = new Set(module.fields.map((f) => f.id));
    const { allowed, stripped } = this.buildAllowedFieldNames(module.fields, fieldPerms, moduleFieldIds);

    return {
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      ...this.filterRecord(record.data as Record<string, unknown>, allowed),
      strippedFields: stripped.length > 0 ? stripped : undefined,
    };
  }

  async createRecord(apiKey: ApiKey, slug: string, data: Record<string, unknown>) {
    const module = await this.resolveModule(slug, apiKey.userId);
    const { modulePerm } = await this.getPermissions(apiKey.id, module.id);

    if (!modulePerm?.canCreate) {
      throw new ForbiddenException(`API key does not have create permission for module '${slug}'`);
    }

    // Validate required fields
    const requiredFields = module.fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !(f.name in data));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missing.map((f) => f.name).join(', ')}`,
      );
    }

    // Only store known fields
    const knownFieldNames = new Set(module.fields.map((f) => f.name));
    const cleanData = Object.fromEntries(Object.entries(data).filter(([k]) => knownFieldNames.has(k)));

    return this.prisma.moduleRecord.create({
      data: { moduleId: module.id, data: cleanData },
    });
  }

  async updateRecord(
    apiKey: ApiKey,
    slug: string,
    recordId: string,
    data: Record<string, unknown>,
  ) {
    const module = await this.resolveModule(slug, apiKey.userId);
    const { modulePerm, fieldPerms } = await this.getPermissions(apiKey.id, module.id);

    if (!modulePerm?.canUpdate) {
      throw new ForbiddenException(`API key does not have update permission for module '${slug}'`);
    }

    const record = await this.prisma.moduleRecord.findFirst({
      where: { id: recordId, moduleId: module.id },
    });
    if (!record) throw new NotFoundException('Record not found');

    const moduleFieldIds = new Set(module.fields.map((f) => f.id));
    const { allowed } = this.buildAllowedFieldNames(module.fields, fieldPerms, moduleFieldIds);

    // Only update fields the key has access to
    const allowedData = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.has(k)),
    );

    const existing = record.data as Record<string, unknown>;
    return this.prisma.moduleRecord.update({
      where: { id: recordId },
      data: { data: { ...existing, ...allowedData } },
    });
  }

  async deleteRecord(apiKey: ApiKey, slug: string, recordId: string) {
    const module = await this.resolveModule(slug, apiKey.userId);
    const { modulePerm } = await this.getPermissions(apiKey.id, module.id);

    if (!modulePerm?.canDelete) {
      throw new ForbiddenException(`API key does not have delete permission for module '${slug}'`);
    }

    const record = await this.prisma.moduleRecord.findFirst({
      where: { id: recordId, moduleId: module.id },
    });
    if (!record) throw new NotFoundException('Record not found');

    return this.prisma.moduleRecord.delete({ where: { id: recordId } });
  }
}
