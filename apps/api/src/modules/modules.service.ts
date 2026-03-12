import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto, CreateModuleFieldDto } from './dto/create-module.dto';
import { UpdateModuleDto, UpdateModuleFieldDto } from './dto/update-module.dto';
import { Environment } from '@dmds/types';

// ─── Demo data helpers ────────────────────────────────────────────────────────
const _pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const _int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const _float = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const _date = (daysAgo = 365) => new Date(Date.now() - _int(0, daysAgo) * 86400000).toISOString();
const _id = () => Math.random().toString(36).slice(2, 10).toUpperCase();

type DemoField = { name: string; type: string; required?: boolean; sensitive?: boolean };
type DemoModule = { name: string; slug: string; description: string; fields: DemoField[]; sampleData: () => Record<string, unknown> };

const DEMO_MODULES: DemoModule[] = [
  {
    name: 'Customers', slug: 'customers', description: 'CRM customer records',
    fields: [
      { name: 'name', type: 'STRING', required: true }, { name: 'email', type: 'STRING', required: true },
      { name: 'phone', type: 'STRING' }, { name: 'address', type: 'STRING' }, { name: 'company', type: 'STRING' },
      { name: 'credit_score', type: 'NUMBER', sensitive: true }, { name: 'tier', type: 'STRING' }, { name: 'created_at', type: 'DATE' },
    ],
    sampleData: () => ({
      name: _pick(['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Eve Chen']),
      email: `user${_int(100, 999)}@example.com`, phone: `+1-555-${_int(1000, 9999)}`,
      address: `${_int(1, 999)} ${_pick(['Oak St', 'Maple Ave', 'Pine Rd', 'Elm Dr'])}`,
      company: _pick(['Acme Corp', 'TechFlow Inc', 'Globex', 'Initech', 'Umbrella Ltd']),
      credit_score: _int(550, 850), tier: _pick(['bronze', 'silver', 'gold', 'platinum']), created_at: _date(730),
    }),
  },
  {
    name: 'Products', slug: 'products', description: 'E-commerce product catalog',
    fields: [
      { name: 'name', type: 'STRING', required: true }, { name: 'sku', type: 'STRING', required: true },
      { name: 'price', type: 'NUMBER', required: true }, { name: 'stock_qty', type: 'NUMBER' },
      { name: 'category', type: 'STRING' }, { name: 'description', type: 'STRING' }, { name: 'active', type: 'BOOLEAN' },
    ],
    sampleData: () => ({
      name: _pick(['Wireless Headphones', 'USB-C Hub', 'Mechanical Keyboard', 'Laptop Stand', 'Webcam Pro']),
      sku: `SKU-${_id()}`, price: _float(9.99, 299.99), stock_qty: _int(0, 500),
      category: _pick(['Electronics', 'Accessories', 'Peripherals', 'Office']),
      description: 'High-quality product with premium materials.', active: Math.random() > 0.2,
    }),
  },
  {
    name: 'Orders', slug: 'orders', description: 'E-commerce order management',
    fields: [
      { name: 'order_number', type: 'STRING', required: true }, { name: 'customer_id', type: 'STRING', required: true },
      { name: 'total', type: 'NUMBER', required: true }, { name: 'status', type: 'STRING' },
      { name: 'items', type: 'JSON' }, { name: 'placed_at', type: 'DATE' }, { name: 'shipped_at', type: 'DATE' },
    ],
    sampleData: () => ({
      order_number: `ORD-${_id()}`, customer_id: `cust_${_id()}`, total: _float(19.99, 999.99),
      status: _pick(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
      items: [{ product: 'USB-C Hub', qty: _int(1, 3), price: _float(19.99, 79.99) }],
      placed_at: _date(90), shipped_at: Math.random() > 0.3 ? _date(60) : null,
    }),
  },
  {
    name: 'Inventory', slug: 'inventory', description: 'Warehouse inventory management',
    fields: [
      { name: 'product_id', type: 'STRING', required: true }, { name: 'warehouse', type: 'STRING' },
      { name: 'qty_available', type: 'NUMBER' }, { name: 'reorder_level', type: 'NUMBER' },
      { name: 'last_restocked', type: 'DATE' }, { name: 'supplier', type: 'STRING' },
    ],
    sampleData: () => ({
      product_id: `prod_${_id()}`, warehouse: _pick(['WH-NYC', 'WH-LAX', 'WH-CHI', 'WH-ATL']),
      qty_available: _int(0, 1000), reorder_level: _int(10, 100),
      last_restocked: _date(30), supplier: _pick(['Supplier A', 'Supplier B', 'Acme Supply', 'FastShip Co']),
    }),
  },
  {
    name: 'Employees', slug: 'employees', description: 'HR employee records',
    fields: [
      { name: 'first_name', type: 'STRING', required: true }, { name: 'last_name', type: 'STRING', required: true },
      { name: 'department', type: 'STRING' }, { name: 'role', type: 'STRING' },
      { name: 'salary', type: 'NUMBER', sensitive: true }, { name: 'hire_date', type: 'DATE' },
      { name: 'active', type: 'BOOLEAN' }, { name: 'ssn_last4', type: 'STRING', sensitive: true },
    ],
    sampleData: () => ({
      first_name: _pick(['James', 'Sarah', 'Michael', 'Emily', 'Chris']),
      last_name: _pick(['Anderson', 'Martinez', 'Thompson', 'Wilson', 'Davis']),
      department: _pick(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']),
      role: _pick(['Manager', 'Engineer', 'Analyst', 'Director', 'Coordinator']),
      salary: _int(55000, 180000), hire_date: _date(1825), active: Math.random() > 0.1, ssn_last4: String(_int(1000, 9999)),
    }),
  },
  {
    name: 'Invoices', slug: 'invoices', description: 'Finance invoicing',
    fields: [
      { name: 'invoice_no', type: 'STRING', required: true }, { name: 'customer_id', type: 'STRING' },
      { name: 'amount', type: 'NUMBER' }, { name: 'currency', type: 'STRING' },
      { name: 'due_date', type: 'DATE' }, { name: 'paid', type: 'BOOLEAN' }, { name: 'line_items', type: 'JSON' },
    ],
    sampleData: () => ({
      invoice_no: `INV-${_int(10000, 99999)}`, customer_id: `cust_${_id()}`,
      amount: _float(100, 10000), currency: _pick(['USD', 'EUR', 'GBP', 'CAD']),
      due_date: new Date(Date.now() + _int(-30, 60) * 86400000).toISOString(),
      paid: Math.random() > 0.4, line_items: [{ description: 'Service fee', amount: _float(50, 500) }],
    }),
  },
  {
    name: 'Support Tickets', slug: 'support_tickets', description: 'Customer support ticket tracking',
    fields: [
      { name: 'title', type: 'STRING', required: true }, { name: 'description', type: 'STRING' },
      { name: 'priority', type: 'STRING' }, { name: 'status', type: 'STRING' },
      { name: 'customer_id', type: 'STRING' }, { name: 'assigned_to', type: 'STRING' },
      { name: 'created_at', type: 'DATE' }, { name: 'resolved_at', type: 'DATE' },
    ],
    sampleData: () => ({
      title: _pick(['Login issue', 'Payment failed', 'Feature request', 'Bug report', 'Account locked']),
      description: 'User reported an issue with the platform functionality.',
      priority: _pick(['low', 'medium', 'high', 'critical']), status: _pick(['open', 'in_progress', 'resolved', 'closed']),
      customer_id: `cust_${_id()}`, assigned_to: _pick(['agent_alice', 'agent_bob', 'agent_carol', null]),
      created_at: _date(60), resolved_at: Math.random() > 0.5 ? _date(30) : null,
    }),
  },
  {
    name: 'Blog Posts', slug: 'blog_posts', description: 'CMS content management',
    fields: [
      { name: 'title', type: 'STRING', required: true }, { name: 'slug', type: 'STRING', required: true },
      { name: 'body', type: 'STRING' }, { name: 'author', type: 'STRING' }, { name: 'published', type: 'BOOLEAN' },
      { name: 'published_at', type: 'DATE' }, { name: 'tags', type: 'ARRAY' }, { name: 'views', type: 'NUMBER' },
    ],
    sampleData: () => {
      const t = _pick(['Getting Started with APIs', 'Best Practices for Security', 'Top 10 Tips', 'Deep Dive into Permissions', 'Future of Data Systems']);
      return {
        title: t, slug: t.toLowerCase().replace(/\s+/g, '-'),
        body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
        author: _pick(['Alice Johnson', 'Bob Smith', 'Carol White']), published: Math.random() > 0.3,
        published_at: _date(180), tags: _pick([['api', 'tutorial'], ['security', 'best-practices'], ['data', 'systems']]),
        views: _int(50, 5000),
      };
    },
  },
  {
    name: 'Sales Leads', slug: 'sales_leads', description: 'CRM sales pipeline',
    fields: [
      { name: 'company', type: 'STRING', required: true }, { name: 'contact_name', type: 'STRING' },
      { name: 'email', type: 'STRING' }, { name: 'source', type: 'STRING' },
      { name: 'deal_value', type: 'NUMBER', sensitive: true }, { name: 'stage', type: 'STRING' },
      { name: 'owner', type: 'STRING' }, { name: 'last_contacted', type: 'DATE' },
    ],
    sampleData: () => ({
      company: _pick(['BigCorp', 'StartupXYZ', 'Enterprise Solutions', 'Tech Ventures', 'Scale Inc']),
      contact_name: _pick(['John Doe', 'Jane Smith', 'Mark Lee', 'Lisa Wong', 'Tom Brown']),
      email: `contact${_int(1, 99)}@company.com`, source: _pick(['inbound', 'cold-outreach', 'referral', 'conference', 'social']),
      deal_value: _int(5000, 250000), stage: _pick(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
      owner: _pick(['rep_alice', 'rep_bob', 'rep_carol']), last_contacted: _date(14),
    }),
  },
  {
    name: 'Transactions', slug: 'transactions', description: 'Payment transaction records',
    fields: [
      { name: 'tx_id', type: 'STRING', required: true }, { name: 'amount', type: 'NUMBER', required: true },
      { name: 'currency', type: 'STRING' }, { name: 'status', type: 'STRING' }, { name: 'type', type: 'STRING' },
      { name: 'card_last4', type: 'STRING', sensitive: true }, { name: 'customer_id', type: 'STRING' }, { name: 'created_at', type: 'DATE' },
    ],
    sampleData: () => ({
      tx_id: `txn_${_id()}${_id()}`, amount: _float(1.00, 999.99), currency: _pick(['USD', 'EUR', 'GBP']),
      status: _pick(['succeeded', 'pending', 'failed', 'refunded']), type: _pick(['charge', 'refund', 'transfer']),
      card_last4: String(_int(1000, 9999)), customer_id: `cust_${_id()}`, created_at: _date(90),
    }),
  },
  {
    name: 'Subscriptions', slug: 'subscriptions', description: 'SaaS subscription management',
    fields: [
      { name: 'plan', type: 'STRING', required: true }, { name: 'customer_id', type: 'STRING' },
      { name: 'status', type: 'STRING' }, { name: 'start_date', type: 'DATE' }, { name: 'end_date', type: 'DATE' },
      { name: 'mrr', type: 'NUMBER', sensitive: true }, { name: 'billing_cycle', type: 'STRING' },
    ],
    sampleData: () => ({
      plan: _pick(['starter', 'growth', 'professional', 'enterprise']), customer_id: `cust_${_id()}`,
      status: _pick(['active', 'trialing', 'past_due', 'cancelled', 'paused']),
      start_date: _date(365), end_date: new Date(Date.now() + _int(30, 365) * 86400000).toISOString(),
      mrr: _pick([49, 99, 299, 999, 2499]), billing_cycle: _pick(['monthly', 'annual']),
    }),
  },
  {
    name: 'Analytics Events', slug: 'analytics_events', description: 'User event tracking',
    fields: [
      { name: 'event_name', type: 'STRING', required: true }, { name: 'user_id', type: 'STRING' },
      { name: 'session_id', type: 'STRING' }, { name: 'properties', type: 'JSON' },
      { name: 'timestamp', type: 'DATE' }, { name: 'platform', type: 'STRING' },
    ],
    sampleData: () => ({
      event_name: _pick(['page_view', 'button_click', 'form_submit', 'purchase_complete', 'sign_up', 'sign_in']),
      user_id: `usr_${_id()}`, session_id: `sess_${_id()}`,
      properties: { page: _pick(['/dashboard', '/home', '/pricing']), referrer: _pick(['google', 'direct', 'twitter']) },
      timestamp: _date(7), platform: _pick(['web', 'mobile_ios', 'mobile_android']),
    }),
  },
  {
    name: 'Projects', slug: 'projects', description: 'Project management',
    fields: [
      { name: 'name', type: 'STRING', required: true }, { name: 'description', type: 'STRING' },
      { name: 'owner', type: 'STRING' }, { name: 'deadline', type: 'DATE' },
      { name: 'status', type: 'STRING' }, { name: 'budget', type: 'NUMBER' }, { name: 'members', type: 'ARRAY' },
    ],
    sampleData: () => ({
      name: _pick(['Website Redesign', 'API Integration', 'Mobile App v2', 'Data Migration', 'Platform Upgrade']),
      description: 'Strategic initiative to improve platform capabilities.',
      owner: _pick(['alice', 'bob', 'carol', 'dave']),
      deadline: new Date(Date.now() + _int(14, 180) * 86400000).toISOString(),
      status: _pick(['planning', 'in_progress', 'review', 'completed', 'on_hold']),
      budget: _int(10000, 500000), members: _pick([['alice', 'bob'], ['carol', 'dave', 'eve'], ['bob', 'charlie']]),
    }),
  },
  {
    name: 'Feedback', slug: 'feedback', description: 'User feedback and reviews',
    fields: [
      { name: 'rating', type: 'NUMBER', required: true }, { name: 'comment', type: 'STRING' },
      { name: 'user_id', type: 'STRING' }, { name: 'product_id', type: 'STRING' },
      { name: 'category', type: 'STRING' }, { name: 'sentiment', type: 'STRING' }, { name: 'created_at', type: 'DATE' },
    ],
    sampleData: () => ({
      rating: _int(1, 5),
      comment: _pick(['Great product, very satisfied!', 'Could be better, had some issues.', 'Exactly what I needed.', 'Fast shipping, good quality.', 'Not what I expected.']),
      user_id: `usr_${_id()}`, product_id: `prod_${_id()}`,
      category: _pick(['product', 'shipping', 'support', 'pricing', 'ux']),
      sentiment: _pick(['positive', 'neutral', 'negative']), created_at: _date(60),
    }),
  },
  {
    name: 'Shipments', slug: 'shipments', description: 'Logistics shipment tracking',
    fields: [
      { name: 'tracking_no', type: 'STRING', required: true }, { name: 'carrier', type: 'STRING' },
      { name: 'status', type: 'STRING' }, { name: 'origin', type: 'STRING' }, { name: 'destination', type: 'STRING' },
      { name: 'weight_kg', type: 'NUMBER' }, { name: 'estimated_delivery', type: 'DATE' }, { name: 'delivered_at', type: 'DATE' },
    ],
    sampleData: () => ({
      tracking_no: `${_pick(['1Z', 'FX', 'UPS'])}${_id()}${_id()}`,
      carrier: _pick(['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon Logistics']),
      status: _pick(['processing', 'in_transit', 'out_for_delivery', 'delivered', 'delayed']),
      origin: _pick(['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX']),
      destination: _pick(['Boston, MA', 'Seattle, WA', 'Miami, FL', 'Denver, CO', 'Austin, TX']),
      weight_kg: _float(0.1, 25.0),
      estimated_delivery: new Date(Date.now() + _int(1, 7) * 86400000).toISOString(),
      delivered_at: Math.random() > 0.4 ? _date(14) : null,
    }),
  },
];

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

  async findAll(environment?: Environment) {
    return this.prisma.module.findMany({
      where: {
        ...(environment && { environment }),
      },
      include: { fields: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const module = await this.prisma.module.findFirst({
      where: { id },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async findBySlug(slug: string) {
    const module = await this.prisma.module.findFirst({
      where: { slug },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!module) throw new NotFoundException(`Module '${slug}' not found`);
    return module;
  }

  async create(userId: string, dto: CreateModuleDto) {
    let slug = dto.slug || toSlug(dto.name);

    // Handle slug collision globally
    const existing = await this.prisma.module.findFirst({ where: { slug } });
    if (existing) {
      const count = await this.prisma.module.count({ where: { slug: { startsWith: slug } } });
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

  async update(id: string, dto: UpdateModuleDto) {
    await this.findOne(id);
    return this.prisma.module.update({
      where: { id },
      data: dto,
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.module.delete({ where: { id } });
  }

  // ─── Fields ───────────────────────────────────────────────────────────────

  async addField(moduleId: string, dto: CreateModuleFieldDto) {
    await this.findOne(moduleId);
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

  async updateField(moduleId: string, fieldId: string, dto: UpdateModuleFieldDto) {
    await this.findOne(moduleId);
    const field = await this.prisma.moduleField.findFirst({ where: { id: fieldId, moduleId } });
    if (!field) throw new NotFoundException('Field not found');
    return this.prisma.moduleField.update({ where: { id: fieldId }, data: dto });
  }

  async removeField(moduleId: string, fieldId: string) {
    await this.findOne(moduleId);
    const field = await this.prisma.moduleField.findFirst({ where: { id: fieldId, moduleId } });
    if (!field) throw new NotFoundException('Field not found');
    return this.prisma.moduleField.delete({ where: { id: fieldId } });
  }

  async reorderFields(moduleId: string, fieldIds: string[]) {
    await this.findOne(moduleId);
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
