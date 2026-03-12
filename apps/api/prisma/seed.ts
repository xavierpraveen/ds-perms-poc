import { PrismaClient, Environment, FieldType } from '@prisma/client';

type SeedField = { name: string; type: FieldType; required?: boolean; sensitive?: boolean };

const prisma = new PrismaClient();

// Fake data helpers
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randDate = (daysAgo = 365) => new Date(Date.now() - randInt(0, daysAgo) * 86400000).toISOString();
const randId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

const SEED_USER_ID = 'user_seed_demo_001';

const modules = [
  {
    name: 'Customers',
    slug: 'customers',
    description: 'CRM customer records',
    fields: [
      { name: 'name', type: FieldType.STRING, required: true },
      { name: 'email', type: FieldType.STRING, required: true },
      { name: 'phone', type: FieldType.STRING },
      { name: 'address', type: FieldType.STRING },
      { name: 'company', type: FieldType.STRING },
      { name: 'credit_score', type: FieldType.NUMBER, sensitive: true },
      { name: 'tier', type: FieldType.STRING },
      { name: 'created_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      name: pick(['Alice Johnson', 'Bob Smith', 'Carol White', 'David Lee', 'Eve Chen']),
      email: `user${randInt(100, 999)}@example.com`,
      phone: `+1-555-${randInt(1000, 9999)}`,
      address: `${randInt(1, 999)} ${pick(['Oak St', 'Maple Ave', 'Pine Rd', 'Elm Dr'])}`,
      company: pick(['Acme Corp', 'TechFlow Inc', 'Globex', 'Initech', 'Umbrella Ltd']),
      credit_score: randInt(550, 850),
      tier: pick(['bronze', 'silver', 'gold', 'platinum']),
      created_at: randDate(730),
    }),
  },
  {
    name: 'Products',
    slug: 'products',
    description: 'E-commerce product catalog',
    fields: [
      { name: 'name', type: FieldType.STRING, required: true },
      { name: 'sku', type: FieldType.STRING, required: true },
      { name: 'price', type: FieldType.NUMBER, required: true },
      { name: 'stock_qty', type: FieldType.NUMBER },
      { name: 'category', type: FieldType.STRING },
      { name: 'description', type: FieldType.STRING },
      { name: 'active', type: FieldType.BOOLEAN },
    ],
    sampleData: () => ({
      name: pick(['Wireless Headphones', 'USB-C Hub', 'Mechanical Keyboard', 'Laptop Stand', 'Webcam Pro']),
      sku: `SKU-${randId()}`,
      price: randFloat(9.99, 299.99),
      stock_qty: randInt(0, 500),
      category: pick(['Electronics', 'Accessories', 'Peripherals', 'Office']),
      description: 'High-quality product with premium materials.',
      active: Math.random() > 0.2,
    }),
  },
  {
    name: 'Orders',
    slug: 'orders',
    description: 'E-commerce order management',
    fields: [
      { name: 'order_number', type: FieldType.STRING, required: true },
      { name: 'customer_id', type: FieldType.STRING, required: true },
      { name: 'total', type: FieldType.NUMBER, required: true },
      { name: 'status', type: FieldType.STRING },
      { name: 'items', type: FieldType.JSON },
      { name: 'placed_at', type: FieldType.DATE },
      { name: 'shipped_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      order_number: `ORD-${randId()}`,
      customer_id: `cust_${randId()}`,
      total: randFloat(19.99, 999.99),
      status: pick(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
      items: [{ product: 'USB-C Hub', qty: randInt(1, 3), price: randFloat(19.99, 79.99) }],
      placed_at: randDate(90),
      shipped_at: Math.random() > 0.3 ? randDate(60) : null,
    }),
  },
  {
    name: 'Inventory',
    slug: 'inventory',
    description: 'Warehouse inventory management',
    fields: [
      { name: 'product_id', type: FieldType.STRING, required: true },
      { name: 'warehouse', type: FieldType.STRING },
      { name: 'qty_available', type: FieldType.NUMBER },
      { name: 'reorder_level', type: FieldType.NUMBER },
      { name: 'last_restocked', type: FieldType.DATE },
      { name: 'supplier', type: FieldType.STRING },
    ],
    sampleData: () => ({
      product_id: `prod_${randId()}`,
      warehouse: pick(['WH-NYC', 'WH-LAX', 'WH-CHI', 'WH-ATL']),
      qty_available: randInt(0, 1000),
      reorder_level: randInt(10, 100),
      last_restocked: randDate(30),
      supplier: pick(['Supplier A', 'Supplier B', 'Acme Supply', 'FastShip Co']),
    }),
  },
  {
    name: 'Employees',
    slug: 'employees',
    description: 'HR employee records',
    fields: [
      { name: 'first_name', type: FieldType.STRING, required: true },
      { name: 'last_name', type: FieldType.STRING, required: true },
      { name: 'department', type: FieldType.STRING },
      { name: 'role', type: FieldType.STRING },
      { name: 'salary', type: FieldType.NUMBER, sensitive: true },
      { name: 'hire_date', type: FieldType.DATE },
      { name: 'active', type: FieldType.BOOLEAN },
      { name: 'ssn_last4', type: FieldType.STRING, sensitive: true },
    ],
    sampleData: () => ({
      first_name: pick(['James', 'Sarah', 'Michael', 'Emily', 'Chris']),
      last_name: pick(['Anderson', 'Martinez', 'Thompson', 'Wilson', 'Davis']),
      department: pick(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']),
      role: pick(['Manager', 'Engineer', 'Analyst', 'Director', 'Coordinator']),
      salary: randInt(55000, 180000),
      hire_date: randDate(1825),
      active: Math.random() > 0.1,
      ssn_last4: String(randInt(1000, 9999)),
    }),
  },
  {
    name: 'Invoices',
    slug: 'invoices',
    description: 'Finance invoicing',
    fields: [
      { name: 'invoice_no', type: FieldType.STRING, required: true },
      { name: 'customer_id', type: FieldType.STRING },
      { name: 'amount', type: FieldType.NUMBER },
      { name: 'currency', type: FieldType.STRING },
      { name: 'due_date', type: FieldType.DATE },
      { name: 'paid', type: FieldType.BOOLEAN },
      { name: 'line_items', type: FieldType.JSON },
    ],
    sampleData: () => ({
      invoice_no: `INV-${randInt(10000, 99999)}`,
      customer_id: `cust_${randId()}`,
      amount: randFloat(100, 10000),
      currency: pick(['USD', 'EUR', 'GBP', 'CAD']),
      due_date: new Date(Date.now() + randInt(-30, 60) * 86400000).toISOString(),
      paid: Math.random() > 0.4,
      line_items: [{ description: 'Service fee', amount: randFloat(50, 500) }],
    }),
  },
  {
    name: 'Support Tickets',
    slug: 'support_tickets',
    description: 'Customer support ticket tracking',
    fields: [
      { name: 'title', type: FieldType.STRING, required: true },
      { name: 'description', type: FieldType.STRING },
      { name: 'priority', type: FieldType.STRING },
      { name: 'status', type: FieldType.STRING },
      { name: 'customer_id', type: FieldType.STRING },
      { name: 'assigned_to', type: FieldType.STRING },
      { name: 'created_at', type: FieldType.DATE },
      { name: 'resolved_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      title: pick(['Login issue', 'Payment failed', 'Feature request', 'Bug report', 'Account locked']),
      description: 'User reported an issue with the platform functionality.',
      priority: pick(['low', 'medium', 'high', 'critical']),
      status: pick(['open', 'in_progress', 'resolved', 'closed']),
      customer_id: `cust_${randId()}`,
      assigned_to: pick(['agent_alice', 'agent_bob', 'agent_carol', null]),
      created_at: randDate(60),
      resolved_at: Math.random() > 0.5 ? randDate(30) : null,
    }),
  },
  {
    name: 'Blog Posts',
    slug: 'blog_posts',
    description: 'CMS content management',
    fields: [
      { name: 'title', type: FieldType.STRING, required: true },
      { name: 'slug', type: FieldType.STRING, required: true },
      { name: 'body', type: FieldType.STRING },
      { name: 'author', type: FieldType.STRING },
      { name: 'published', type: FieldType.BOOLEAN },
      { name: 'published_at', type: FieldType.DATE },
      { name: 'tags', type: FieldType.ARRAY },
      { name: 'views', type: FieldType.NUMBER },
    ],
    sampleData: () => {
      const titles = ['Getting Started with APIs', 'Best Practices for Security', 'Top 10 Tips', 'Deep Dive into Permissions', 'Future of Data Systems'];
      const t = pick(titles);
      return {
        title: t,
        slug: t.toLowerCase().replace(/\s+/g, '-'),
        body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
        author: pick(['Alice Johnson', 'Bob Smith', 'Carol White']),
        published: Math.random() > 0.3,
        published_at: randDate(180),
        tags: pick([['api', 'tutorial'], ['security', 'best-practices'], ['data', 'systems']]),
        views: randInt(50, 5000),
      };
    },
  },
  {
    name: 'Sales Leads',
    slug: 'sales_leads',
    description: 'CRM sales pipeline',
    fields: [
      { name: 'company', type: FieldType.STRING, required: true },
      { name: 'contact_name', type: FieldType.STRING },
      { name: 'email', type: FieldType.STRING },
      { name: 'source', type: FieldType.STRING },
      { name: 'deal_value', type: FieldType.NUMBER, sensitive: true },
      { name: 'stage', type: FieldType.STRING },
      { name: 'owner', type: FieldType.STRING },
      { name: 'last_contacted', type: FieldType.DATE },
    ],
    sampleData: () => ({
      company: pick(['BigCorp', 'StartupXYZ', 'Enterprise Solutions', 'Tech Ventures', 'Scale Inc']),
      contact_name: pick(['John Doe', 'Jane Smith', 'Mark Lee', 'Lisa Wong', 'Tom Brown']),
      email: `contact${randInt(1, 99)}@company.com`,
      source: pick(['inbound', 'cold-outreach', 'referral', 'conference', 'social']),
      deal_value: randInt(5000, 250000),
      stage: pick(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
      owner: pick(['rep_alice', 'rep_bob', 'rep_carol']),
      last_contacted: randDate(14),
    }),
  },
  {
    name: 'Transactions',
    slug: 'transactions',
    description: 'Payment transaction records',
    fields: [
      { name: 'tx_id', type: FieldType.STRING, required: true },
      { name: 'amount', type: FieldType.NUMBER, required: true },
      { name: 'currency', type: FieldType.STRING },
      { name: 'status', type: FieldType.STRING },
      { name: 'type', type: FieldType.STRING },
      { name: 'card_last4', type: FieldType.STRING, sensitive: true },
      { name: 'customer_id', type: FieldType.STRING },
      { name: 'created_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      tx_id: `txn_${randId()}${randId()}`,
      amount: randFloat(1.00, 999.99),
      currency: pick(['USD', 'EUR', 'GBP']),
      status: pick(['succeeded', 'pending', 'failed', 'refunded']),
      type: pick(['charge', 'refund', 'transfer']),
      card_last4: String(randInt(1000, 9999)),
      customer_id: `cust_${randId()}`,
      created_at: randDate(90),
    }),
  },
  {
    name: 'Subscriptions',
    slug: 'subscriptions',
    description: 'SaaS subscription management',
    fields: [
      { name: 'plan', type: FieldType.STRING, required: true },
      { name: 'customer_id', type: FieldType.STRING },
      { name: 'status', type: FieldType.STRING },
      { name: 'start_date', type: FieldType.DATE },
      { name: 'end_date', type: FieldType.DATE },
      { name: 'mrr', type: FieldType.NUMBER, sensitive: true },
      { name: 'billing_cycle', type: FieldType.STRING },
    ],
    sampleData: () => ({
      plan: pick(['starter', 'growth', 'professional', 'enterprise']),
      customer_id: `cust_${randId()}`,
      status: pick(['active', 'trialing', 'past_due', 'cancelled', 'paused']),
      start_date: randDate(365),
      end_date: new Date(Date.now() + randInt(30, 365) * 86400000).toISOString(),
      mrr: pick([49, 99, 299, 999, 2499]),
      billing_cycle: pick(['monthly', 'annual']),
    }),
  },
  {
    name: 'Analytics Events',
    slug: 'analytics_events',
    description: 'User event tracking',
    fields: [
      { name: 'event_name', type: FieldType.STRING, required: true },
      { name: 'user_id', type: FieldType.STRING },
      { name: 'session_id', type: FieldType.STRING },
      { name: 'properties', type: FieldType.JSON },
      { name: 'timestamp', type: FieldType.DATE },
      { name: 'platform', type: FieldType.STRING },
    ],
    sampleData: () => ({
      event_name: pick(['page_view', 'button_click', 'form_submit', 'purchase_complete', 'sign_up', 'sign_in']),
      user_id: `usr_${randId()}`,
      session_id: `sess_${randId()}`,
      properties: { page: pick(['/dashboard', '/home', '/pricing']), referrer: pick(['google', 'direct', 'twitter']) },
      timestamp: randDate(7),
      platform: pick(['web', 'mobile_ios', 'mobile_android']),
    }),
  },
  {
    name: 'Projects',
    slug: 'projects',
    description: 'Project management',
    fields: [
      { name: 'name', type: FieldType.STRING, required: true },
      { name: 'description', type: FieldType.STRING },
      { name: 'owner', type: FieldType.STRING },
      { name: 'deadline', type: FieldType.DATE },
      { name: 'status', type: FieldType.STRING },
      { name: 'budget', type: FieldType.NUMBER },
      { name: 'members', type: FieldType.ARRAY },
    ],
    sampleData: () => ({
      name: pick(['Website Redesign', 'API Integration', 'Mobile App v2', 'Data Migration', 'Platform Upgrade']),
      description: 'Strategic initiative to improve platform capabilities.',
      owner: pick(['alice', 'bob', 'carol', 'dave']),
      deadline: new Date(Date.now() + randInt(14, 180) * 86400000).toISOString(),
      status: pick(['planning', 'in_progress', 'review', 'completed', 'on_hold']),
      budget: randInt(10000, 500000),
      members: pick([['alice', 'bob'], ['carol', 'dave', 'eve'], ['bob', 'charlie']]),
    }),
  },
  {
    name: 'Feedback',
    slug: 'feedback',
    description: 'User feedback and reviews',
    fields: [
      { name: 'rating', type: FieldType.NUMBER, required: true },
      { name: 'comment', type: FieldType.STRING },
      { name: 'user_id', type: FieldType.STRING },
      { name: 'product_id', type: FieldType.STRING },
      { name: 'category', type: FieldType.STRING },
      { name: 'sentiment', type: FieldType.STRING },
      { name: 'created_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      rating: randInt(1, 5),
      comment: pick([
        'Great product, very satisfied!',
        'Could be better, had some issues.',
        'Exactly what I needed.',
        'Fast shipping, good quality.',
        'Not what I expected.',
      ]),
      user_id: `usr_${randId()}`,
      product_id: `prod_${randId()}`,
      category: pick(['product', 'shipping', 'support', 'pricing', 'ux']),
      sentiment: pick(['positive', 'neutral', 'negative']),
      created_at: randDate(60),
    }),
  },
  {
    name: 'Shipments',
    slug: 'shipments',
    description: 'Logistics shipment tracking',
    fields: [
      { name: 'tracking_no', type: FieldType.STRING, required: true },
      { name: 'carrier', type: FieldType.STRING },
      { name: 'status', type: FieldType.STRING },
      { name: 'origin', type: FieldType.STRING },
      { name: 'destination', type: FieldType.STRING },
      { name: 'weight_kg', type: FieldType.NUMBER },
      { name: 'estimated_delivery', type: FieldType.DATE },
      { name: 'delivered_at', type: FieldType.DATE },
    ],
    sampleData: () => ({
      tracking_no: `${pick(['1Z', 'FX', 'UPS'])}${randId()}${randId()}`,
      carrier: pick(['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon Logistics']),
      status: pick(['processing', 'in_transit', 'out_for_delivery', 'delivered', 'delayed']),
      origin: pick(['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX']),
      destination: pick(['Boston, MA', 'Seattle, WA', 'Miami, FL', 'Denver, CO', 'Austin, TX']),
      weight_kg: randFloat(0.1, 25.0),
      estimated_delivery: new Date(Date.now() + randInt(1, 7) * 86400000).toISOString(),
      delivered_at: Math.random() > 0.4 ? randDate(14) : null,
    }),
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Upsert demo user
  await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    update: {},
    create: { id: SEED_USER_ID },
  });

  console.log(`✅ Upserted seed user: ${SEED_USER_ID}`);

  for (const mod of modules) {
    // Create or update module
    const existing = await prisma.module.findFirst({
      where: { userId: SEED_USER_ID, slug: mod.slug },
    });

    let moduleId: string;

    if (existing) {
      moduleId = existing.id;
      console.log(`⏭  Module '${mod.slug}' already exists, skipping creation`);
    } else {
      const created = await prisma.module.create({
        data: {
          userId: SEED_USER_ID,
          name: mod.name,
          slug: mod.slug,
          description: mod.description,
          environment: Environment.PRODUCTION,
          fields: {
            create: (mod.fields as SeedField[]).map((f, i) => ({
              name: f.name,
              type: f.type,
              required: f.required ?? false,
              sensitive: f.sensitive ?? false,
              order: i,
            })),
          },
        },
      });
      moduleId = created.id;
      console.log(`✅ Created module: ${mod.slug}`);
    }

    // Seed 5 records per module
    const existingRecords = await prisma.moduleRecord.count({ where: { moduleId } });
    if (existingRecords < 5) {
      const toCreate = 5 - existingRecords;
      await prisma.moduleRecord.createMany({
        data: Array.from({ length: toCreate }, () => ({
          moduleId,
          data: mod.sampleData() as object,
        })),
      });
      console.log(`  ↳ Created ${toCreate} sample records for '${mod.slug}'`);
    }
  }

  console.log('\n🎉 Seed complete! 15 modules with sample data.');
  console.log(`\nSeed user ID: ${SEED_USER_ID}`);
  console.log('Use this ID for testing or sign in with Clerk and your account will be auto-created.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
