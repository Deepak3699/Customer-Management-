/* Sample seed script for Shop Manager */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL not found (check .env.local)');
  process.exit(1);
}

const sql = neon(url);

async function seed() {
  console.log('🌱 Seeding sample data...');

  // Shop
  await sql`
    insert into shop (id, name, address, mobile, bill_prefix, overdue_days, lang)
    values (1, 'Salhotra Multi Store', 'Main Bazaar, City', '9876543210', 'INV', 30, 'en')
    on conflict (id) do update set name = excluded.name;
  `;

  // Sample Items
  const items = [
    { code: 'I1001', name: 'Sugar', category: 'Grocery', unit: 'kg', cost_rate: 38, sale_rate: 44, mrp: 45 },
    { code: 'I1002', name: 'Basmati Rice', category: 'Grocery', unit: 'kg', cost_rate: 65, sale_rate: 80, mrp: 85 },
    { code: 'I1003', name: 'Mustard Oil 1L', category: 'Oil & Ghee', unit: 'ltr', cost_rate: 135, sale_rate: 155, mrp: 165 },
    { code: 'I1004', name: 'Tea Leaves 250g', category: 'Grocery', unit: 'pkt', cost_rate: 90, sale_rate: 110, mrp: 120 },
    { code: 'I1005', name: 'Soap', category: 'Soap & Detergent', unit: 'pcs', cost_rate: 22, sale_rate: 28, mrp: 30 }
  ];

  for (const it of items) {
    await sql`
      insert into item (shop_id, code, name, category, unit, cost_rate, sale_rate, mrp)
      values (1, ${it.code}, ${it.name}, ${it.category}, ${it.unit}, ${it.cost_rate}, ${it.sale_rate}, ${it.mrp})
      on conflict (shop_id, code) do update set
        name = excluded.name, sale_rate = excluded.sale_rate, cost_rate = excluded.cost_rate;
    `;
  }

  // Sample Customers
  const customers = [
    { name: 'Ramesh Kumar', mobile: '9876500001', address: 'Street No. 1', opening: 500, credit_limit: 5000 },
    { name: 'Suresh Sharma', mobile: '9876500002', address: 'Main Road', opening: 0, credit_limit: 3000 },
    { name: 'Vikas Verma', mobile: '9876500003', address: 'Ward 4', opening: 1200, credit_limit: 10000 }
  ];

  for (const c of customers) {
    const existing = await sql`select id from customer where shop_id = 1 and mobile = ${c.mobile}`;
    if (!existing.length) {
      await sql`
        insert into customer (shop_id, name, mobile, address, opening, credit_limit)
        values (1, ${c.name}, ${c.mobile}, ${c.address}, ${c.opening}, ${c.credit_limit});
      `;
    }
  }

  console.log('✅ Seed successful! Sample items and customers created.');
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
