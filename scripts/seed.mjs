/* Sample seed script for Shop Manager */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL nahi mila (.env.local check karein)');
  process.exit(1);
}

const sql = neon(url);

async function seed() {
  console.log('🌱 Seeding sample data...');

  // Shop
  await sql`
    insert into shop (id, name, address, mobile, bill_prefix, overdue_days, lang)
    values (1, 'मेरी दुकान', 'मुख्य बाज़ार, शहर', '9876543210', 'INV', 30, 'hi')
    on conflict (id) do update set name = excluded.name;
  `;

  // Sample Items
  const items = [
    { code: 'I1001', name: 'चीनी (Sugar)', category: 'किराना', unit: 'kg', cost_rate: 38, sale_rate: 44, mrp: 45 },
    { code: 'I1002', name: 'चावल बासमती (Rice)', category: 'किराना', unit: 'kg', cost_rate: 65, sale_rate: 80, mrp: 85 },
    { code: 'I1003', name: 'सरसों तेल 1L (Mustard Oil)', category: 'तेल', unit: 'ltr', cost_rate: 135, sale_rate: 155, mrp: 165 },
    { code: 'I1004', name: 'चाय पत्ती 250g (Tea)', category: 'किराना', unit: 'pkt', cost_rate: 90, sale_rate: 110, mrp: 120 },
    { code: 'I1005', name: 'साबुन (Soap)', category: 'कॉस्मेटिक', unit: 'pcs', cost_rate: 22, sale_rate: 28, mrp: 30 }
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
    { name: 'रमेश कुमार (Ramesh)', mobile: '9876500001', address: 'गली नं. 1', opening: 500, credit_limit: 5000 },
    { name: 'सुरेश शर्मा (Suresh)', mobile: '9876500002', address: 'मेन रोड', opening: 0, credit_limit: 3000 },
    { name: 'विकास वर्मा (Vikas)', mobile: '9876500003', address: 'वार्ड 4', opening: 1200, credit_limit: 10000 }
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

  console.log('✅ Seed safal! Sample items aur customers create ho gaye.');
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
