import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto, UpdateApiKeyDto, AssignPermissionsDto } from './dto/api-key.dto';
import { SparklineDataPoint } from '@dmds/types';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      include: {
        modulePerms: {
          include: { module: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip keyHash, add moduleTags
    return keys.map(({ keyHash: _kh, ...key }) => ({
      ...key,
      moduleTags: key.modulePerms.map((p) => ({
        moduleName: p.module.name,
        moduleSlug: p.module.slug,
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      })),
    }));
  }

  async findOne(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
      include: {
        modulePerms: {
          include: { module: { select: { id: true, name: true, slug: true } } },
        },
        fieldPerms: true,
      },
    });
    if (!key) throw new NotFoundException('API key not found');
    const { keyHash: _kh, ...rest } = key;
    return rest;
  }

  async create(userId: string, dto: CreateApiKeyDto) {
    const envTag = dto.environment === 'PRODUCTION' ? 'live' : 'sandbox';
    const secret = randomBytes(32).toString('hex');
    const rawKey = `dmds_${envTag}_${secret}`;
    const keyPrefix = rawKey.slice(0, 15);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        keyPrefix,
        keyHash,
        environment: dto.environment,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    const { keyHash: _kh, ...rest } = apiKey;
    // Return rawKey ONCE — never stored in plain text again
    return { ...rest, key: rawKey };
  }

  async update(id: string, userId: string, dto: UpdateApiKeyDto) {
    await this.verifyOwnership(id, userId);
    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: dto,
    });
    const { keyHash: _kh, ...rest } = updated;
    return rest;
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(id, userId);
    return this.prisma.apiKey.delete({ where: { id } });
  }

  async getPermissions(id: string, userId: string) {
    await this.verifyOwnership(id, userId);
    const [modulePermissions, fieldPermissions] = await Promise.all([
      this.prisma.apiKeyModulePermission.findMany({ where: { apiKeyId: id } }),
      this.prisma.apiKeyFieldPermission.findMany({ where: { apiKeyId: id } }),
    ]);
    return { modulePermissions, fieldPermissions };
  }

  async assignPermissions(id: string, userId: string, dto: AssignPermissionsDto) {
    await this.verifyOwnership(id, userId);

    await this.prisma.$transaction([
      this.prisma.apiKeyModulePermission.deleteMany({ where: { apiKeyId: id } }),
      this.prisma.apiKeyFieldPermission.deleteMany({ where: { apiKeyId: id } }),
      this.prisma.apiKeyModulePermission.createMany({
        data: dto.modulePermissions.map((p) => ({
          apiKeyId: id,
          moduleId: p.moduleId,
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        })),
      }),
      this.prisma.apiKeyFieldPermission.createMany({
        data: dto.fieldPermissions.map((p) => ({
          apiKeyId: id,
          moduleFieldId: p.moduleFieldId,
          allowed: p.allowed,
        })),
      }),
    ]);

    return this.getPermissions(id, userId);
  }

  async getSparkline(id: string, userId: string): Promise<SparklineDataPoint[]> {
    await this.verifyOwnership(id, userId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const results = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS date,
        COUNT(*) AS count
      FROM "request_logs"
      WHERE "apiKeyId" = ${id}::uuid
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    const resultMap = new Map(
      results.map((r) => [r.date.toISOString().slice(0, 10), Number(r.count)]),
    );

    const sparkline: SparklineDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      sparkline.push({ date: dateKey, count: resultMap.get(dateKey) ?? 0 });
    }

    return sparkline;
  }

  private async verifyOwnership(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    return key;
  }
}
