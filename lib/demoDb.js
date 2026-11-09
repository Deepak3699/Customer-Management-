/* =====================================================================
   Demo database — an embedded PostgreSQL (PGlite) used only when
   DEMO_DB=1. Lets you run / preview the whole app with zero setup:

       npm i && npm run demo      →  http://localhost:3000   (PIN 1234)

   Nothing here is used in production: lib/db.js only reaches for this
   module when the DEMO_DB environment variable is set to 1.
   ===================================================================== */

import { readFileSync } from 'fs';
import { splitSql } from './splitSql.js';
import { join } from 'node:path';

const KEY = Symbol.for('shop.demo.pglite');

/* ---------- deterministic pseudo-random (stable demo data) ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rnd = rng(20240917);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = (a, b) => a + rnd() * (b - a);
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const ITEMS = [
  ['I1001', 'Sugar', 'Grocery', 'kg', 38, 44, 45],
  ['I1002', 'Basmati Rice', 'Pulses & Rice', 'kg', 65, 80, 85],
  ['I1003', 'Toor Dal', 'Pulses & Rice', 'kg', 92, 110, 118],
  ['I1004', 'Mustard Oil 1L', 'Oil & Ghee', 'ltr', 135, 155, 165],
  ['I1005', 'Sunflower Oil 1L', 'Oil & Ghee', 'ltr', 118, 138, 145],
  ['I1006', 'Desi Ghee 500ml', 'Oil & Ghee', 'pcs', 260, 310, 330],
  ['I1007', 'Tea Leaves 250g', 'Beverages', 'packet', 90, 110, 120],
  ['I1008', 'Coffee Powder 100g', 'Beverages', 'packet', 110, 140, 150],
  ['I1009', 'Milk Packet 500ml', 'Beverages', 'pcs', 26, 30, 32],
  ['I1010', 'Wheat Flour 5kg', 'Grocery', 'packet', 210, 245, 260],
  ['I1011', 'Maida 1kg', 'Grocery', 'kg', 34, 42, 45],
  ['I1012', 'Salt 1kg', 'Grocery', 'kg', 18, 24, 25],
  ['I1013', 'Turmeric Powder 100g', 'Spices', 'packet', 28, 38, 40],
  ['I1014', 'Red Chilli 100g', 'Spices', 'packet', 42, 55, 60],
  ['I1015', 'Garam Masala 50g', 'Spices', 'packet', 35, 48, 50],
  ['I1016', 'Cumin Seeds 100g', 'Spices', 'packet', 40, 52, 55],
  ['I1017', 'Parle-G Biscuit', 'Biscuits & Snacks', 'pcs', 5, 7, 8],
  ['I1018', 'Potato Chips', 'Biscuits & Snacks', 'pcs', 18, 25, 25],
  ['I1019', 'Namkeen 200g', 'Biscuits & Snacks', 'packet', 40, 55, 60],
  ['I1020', 'Detergent Powder 1kg', 'Soap & Detergent', 'packet', 85, 110, 120],
  ['I1021', 'Dish Wash Liquid', 'Soap & Detergent', 'pcs', 78, 99, 110],
  ['I1022', 'Bathing Soap', 'Soap & Detergent', 'pcs', 32, 42, 45],
  ['I1023', 'Colgate 100g', 'Soap & Detergent', 'pcs', 48, 62, 65],
  ['I1024', 'Mineral Water 1L', 'Beverages', 'pcs', 15, 20, 20]
];

const CUSTOMERS = [
  ['Ramesh Kumar', '9876500001', 'Street No. 1, Gali Ramgarh', 12450, 74, 15000],
  ['Suresh Sharma', '9876500002', 'Main Road, Opp. Gurudwara', 8300, 52, 10000],
  ['Vikas Verma', '9876500003', 'Ward No. 4, New Colony', 2750, 19, 5000],
  ['Harpreet Singh', '9876500004', 'Model Town Block A', 18600, 96, 20000],
  ['Manjeet Kaur', '9876500005', 'Circular Road', 0, 0, 8000],
  ['Amit Bansal', '9876500006', 'Old City, Chowk Bazaar', 5400, 33, 10000],
  ['Ravi Shankar', '9876500007', 'Nehru Nagar', 980, 8, 5000],
  ['Pooja Devi', '9876500008', 'Shastri Nagar', 15400, 61, 15000],
  ['Gurmeet Singh', '9876500009', 'Green Avenue', 0, 0, 6000],
  ['Deepak Salhotra', '9876500010', 'Bazar Wali Gali', 620, 5, 3000],
  ['Anjali Gupta', '9876500011', 'Krishna Vihar', 12800, 44, 12000],
  ['Sandeep Joshi', '9876500012', 'Railway Road', 3900, 27, 8000],
  ['Kuldeep Raj', '9876500013', 'Dashmesh Nagar', 750, 12, 4000],
  ['Neha Rani', '9876500014', 'Patel Nagar', 3100, 21, 6000],
  ['Sanjeev Khanna', '9876500015', 'Gobindgarh', 0, 0, 10000],
  ['Meera Krishnan', '9876500016', 'Sector 7', 1650, 16, 5000]
];

const EXPENSE_CATS = ['Rent', 'Electricity', 'Salary', 'Transport', 'Tea/Snacks', 'Repairs', 'Packing'];

const n2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

/* ---------- seed ---------- */
async function seed(db) {
  const q = (text, params) => db.query(text, params).then(r => r.rows);

  await q(`update shop set name = $1, address = $2, mobile = $3, bill_prefix = $4,
           overdue_days = 30, thresh_med_amt = 2000, thresh_med_days = 15,
           thresh_high_amt = 10000, thresh_high_days = 45 where id = 1`,
    ['Salhotra Multi Store', 'Main Bazaar, Amritsar', '9876543210', 'INV']);

  for (const [code, name, cat, unit, cost, sale, mrp] of ITEMS) {
    await q(`insert into item (shop_id, code, name, category, unit, cost_rate, sale_rate, mrp, last_sold)
             values (1, $1, $2, $3, $4, $5, $6, $7, current_date - 3)`,
      [code, name, cat, unit, cost, sale, mrp]);
  }

  const custIds = [];
  for (const [name, mobile, address, balance, overdueDays, limit] of CUSTOMERS) {
    const [c] = await q(`insert into customer (shop_id, name, mobile, address, credit_limit, note)
                         values (1, $1, $2, $3, $4, $5) returning id`,
      [name, mobile, address, limit, 'Regular customer']);
    custIds.push({ id: c.id, balance, overdueDays, limit });
  }

  let billNo = 1000;
  const nextBill = () => 'INV-' + (++billNo);

  async function addSale({ date, customer, lines, paid, mode }) {
    const subtotal = n2(lines.reduce((s, l) => s + l.qty * l.rate, 0));
    const total = subtotal;
    const profit = n2(lines.reduce((s, l) => s + (l.rate - l.cost) * l.qty, 0));
    const [s] = await q(`insert into sale (shop_id, bill_no, customer_id, customer_name, bill_date,
                         subtotal, discount, total, paid, due, pay_mode, profit)
                         values (1, $1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10) returning id`,
      [nextBill(), customer?.id || null, customer?.name || 'Cash Customer', date,
        subtotal, total, n2(paid ?? total), n2(total - (paid ?? total)), mode || 'Cash', profit]);
    for (const l of lines) {
      await q(`insert into sale_item (sale_id, item_id, name, unit, qty, rate, cost_rate, discount, amount)
               values ($1, $2, $3, $4, $5, $6, $7, 0, $8)`,
        [s.id, l.item_id, l.name, l.unit, l.qty, l.rate, l.cost, n2(l.qty * l.rate)]);
    }
    return s;
  }

  function randomLines(n) {
    const lines = [];
    for (let i = 0; i < n; i++) {
      const [code, name, , unit, cost, sale] = pick(ITEMS);
      lines.push({
        item_id: ITEMS.findIndex(x => x[0] === code) + 1,
        name, unit, qty: Math.round(between(1, 5) * 10) / 10, rate: sale, cost
      });
    }
    return lines;
  }

  /* -- 1. opening credit bills: one per customer, dated to create the
        intended days_overdue, followed by a part payment -- */
  for (const c of custIds) {
    if (c.balance <= 0) continue;
    const paid = n2(c.balance * between(0.15, 0.4));
    const gross = n2(c.balance + paid);
    const lines = [];
    let left = gross;
    while (left > 60) {
      const [code, name, , unit, cost, sale] = pick(ITEMS);
      const qty = Math.max(1, Math.round((Math.min(left, between(400, 1400)) / sale) * 10) / 10);
      lines.push({ item_id: ITEMS.findIndex(x => x[0] === code) + 1, name, unit, qty, rate: sale, cost });
      left -= qty * sale;
    }
    await addSale({
      date: iso(daysAgo(c.overdueDays)), customer: c,
      lines, paid: 0, mode: 'Credit'
    });
    if (paid > 0) {
      await q(`insert into payment (shop_id, customer_id, pay_date, amount, mode, note)
               values (1, $1, $2, $3, $4, $5)`,
        [c.id, iso(daysAgo(Math.max(1, Math.floor(c.overdueDays / 2)))), paid,
          pick(['Cash', 'UPI', 'UPI', 'Bank']), 'Part payment']);
    }
  }

  /* -- 2. six months of mostly-cash walk-in business.
        A customer is only allowed to take credit on a bill that is NEWER
        than their opening credit bill — otherwise oldest_due_date (and so
        days_overdue) would drift away from the value we planned above. -- */
  const ageInDays = (date) => Math.round((Date.now() - new Date(date).getTime()) / 86400000);

  for (let m = 5; m >= 0; m--) {
    const base = new Date();
    base.setDate(1); base.setMonth(base.getMonth() - m);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const maxDay = m === 0 ? new Date().getDate() : daysInMonth;
    const isCurrentMonth = m === 0;
    const bills = isCurrentMonth ? Math.round(between(5, 8)) + maxDay * 2 : Math.round(between(34, 48));
    for (let b = 0; b < bills; b++) {
      const day = Math.max(1, Math.min(maxDay, Math.round(between(1, maxDay))));
      const date = iso(new Date(base.getFullYear(), base.getMonth(), day));
      const age = ageInDays(date);
      const eligible = custIds.filter(c => c.overdueDays === 0 ? age === 0 : age < c.overdueDays);
      const credit = eligible.length > 0 && rnd() < 0.24;
      const cust = credit ? pick(eligible) : null;
      const lines = randomLines(Math.round(between(1, 5)));
      const total = n2(lines.reduce((s, l) => s + l.qty * l.rate, 0));
      await addSale({
        date, customer: cust, lines,
        paid: credit ? n2(total * between(0.1, 0.5)) : total,
        mode: credit ? 'Partial' : pick(['Cash', 'Cash', 'UPI'])
      });
    }
  }

  /* -- 2b. a handful of bills dated today so the dashboard shows live trade -- */
  for (let b = 0; b < 5; b++) {
    const eligible = custIds.filter(c => c.overdueDays === 0);
    const credit = eligible.length > 0 && rnd() < 0.4;
    const cust = credit ? pick(eligible) : null;
    const lines = randomLines(Math.round(between(2, 5)));
    const total = n2(lines.reduce((s, l) => s + l.qty * l.rate, 0));
    await addSale({
      date: iso(new Date()), customer: cust, lines,
      paid: credit ? n2(total * between(0.2, 0.6)) : total,
      mode: credit ? 'Partial' : pick(['Cash', 'UPI'])
    });
  }

  /* -- 3. expenses for the last 3 months -- */
  for (let m = 2; m >= 0; m--) {
    const base = new Date();
    base.setDate(1); base.setMonth(base.getMonth() - m);
    for (const cat of EXPENSE_CATS) {
      const amt = { Rent: 12000, Electricity: 2400, Salary: 18000, Transport: 1600 }[cat]
        || Math.round(between(300, 2200));
      const day = cat === 'Rent' ? 5 : cat === 'Salary' ? 1 : Math.round(between(2, 26));
      const maxDay = m === 0 ? new Date().getDate() : 28;
      if (day > maxDay) continue;
      await q(`insert into expense (shop_id, exp_date, category, amount, note)
               values (1, $1, $2, $3, $4)`,
        [iso(new Date(base.getFullYear(), base.getMonth(), day)), cat, amt, cat + ' — ' + base.toLocaleString('en', { month: 'short' })]);
    }
  }

  const [{ n }] = await q('select count(*) as n from sale');
  await q('update shop set next_bill = $1 where id = 1', [n + 1001]);
}

/* ---------- boot ---------- */
async function boot() {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const schema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  for (const st of splitSql(schema)) {
    try { await db.exec(st); }
    catch (e) { console.error('[demo:db] schema statement skipped —', e.message); }
  }
  await seed(db);
  console.log('[demo:db] embedded Postgres ready with sample data');
  return db;
}

export function demoSql() {
  if (!globalThis[KEY]) globalThis[KEY] = boot();
  const ready = globalThis[KEY];

  const run = async (text, params) => {
    const db = await ready;
    const r = await db.query(text, params);
    return r.rows;
  };

  const tag = (strings, ...vals) => {
    let text = strings[0];
    for (let i = 0; i < vals.length; i++) text += '$' + (i + 1) + strings[i + 1];
    return run(text, vals);
  };
  tag.query = run;
  return tag;
}
