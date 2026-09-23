/* Neon Postgres connection + saare queries.
   Har function me shop_id server se aata hai — browser se kabhi nahi. */

import { neon, neonConfig } from '@neondatabase/serverless';

/* lazy connection — build time par connect na ho, sirf request par */
let _sql = null;
function conn() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_MISSING');
    // local testing ke liye (Neon ke bajaye local proxy)
    if (process.env.NEON_LOCAL_PROXY) {
      neonConfig.fetchEndpoint = process.env.NEON_LOCAL_PROXY;
      neonConfig.useSecureWebSocket = false;
      neonConfig.poolQueryViaFetch = true;
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
/* tagged-template + .query() dono forward karo */
export const sql = Object.assign(
  (strings, ...vals) => conn()(strings, ...vals),
  { query: (text, params) => conn()(text, params) }
);

/* Abhi ek hi dukaan hai (single-tenant). multiUser chalu hone par
   yeh session se aayega. */
export const SHOP_ID = 1;

const n2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

/* ================= SHOP ================= */
export async function getShop() {
  const [s] = await sql`select * from shop where id = ${SHOP_ID}`;
  if (!s) return null;
  return {
    ...s,
    thresh_med_amt: Number(s.thresh_med_amt ?? 2000),
    thresh_med_days: Number(s.thresh_med_days ?? 15),
    thresh_high_amt: Number(s.thresh_high_amt ?? 10000),
    thresh_high_days: Number(s.thresh_high_days ?? 45)
  };
}
export async function updateShop(o) {
  const [s] = await sql`
    update shop set
      name = coalesce(${o.name}, name),
      address = coalesce(${o.address}, address),
      mobile = coalesce(${o.mobile}, mobile),
      bill_prefix = coalesce(${o.bill_prefix}, bill_prefix),
      overdue_days = coalesce(${o.overdue_days === undefined ? null : Number(o.overdue_days)}, overdue_days),
      thresh_med_amt = coalesce(${o.thresh_med_amt === undefined ? null : Number(o.thresh_med_amt)}, thresh_med_amt),
      thresh_med_days = coalesce(${o.thresh_med_days === undefined ? null : Number(o.thresh_med_days)}, thresh_med_days),
      thresh_high_amt = coalesce(${o.thresh_high_amt === undefined ? null : Number(o.thresh_high_amt)}, thresh_high_amt),
      thresh_high_days = coalesce(${o.thresh_high_days === undefined ? null : Number(o.thresh_high_days)}, thresh_high_days),
      lang = coalesce(${o.lang}, lang)
    where id = ${SHOP_ID} returning *`;
  return s;
}

/* ================= CUSTOMERS ================= */
export async function listCustomers(q = '') {
  const like = `%${q.toLowerCase()}%`;
  return q
    ? sql`select * from debtors_all where shop_id = ${SHOP_ID}
          and (lower(name) like ${like} or mobile like ${like})
          order by balance desc, name`
    : sql`select * from debtors_all where shop_id = ${SHOP_ID}
          order by balance desc, name`;
}
export async function getCustomer(id) {
  const [c] = await sql`select * from debtors_all
                        where id = ${id} and shop_id = ${SHOP_ID}`;
  return c;
}
export async function addCustomer(o) {
  const [c] = await sql`
    insert into customer (shop_id, name, mobile, address, opening, credit_limit, note, photo_key)
    values (${SHOP_ID}, ${o.name}, ${o.mobile || ''}, ${o.address || ''},
            ${n2(o.opening)}, ${n2(o.credit_limit)}, ${o.note || ''}, ${o.photo_key || null})
    returning *`;
  return c;
}
export async function updateCustomer(id, o) {
  const [c] = await sql`
    update customer set
      name = coalesce(${o.name}, name),
      mobile = coalesce(${o.mobile}, mobile),
      address = coalesce(${o.address}, address),
      opening = coalesce(${o.opening === undefined ? null : n2(o.opening)}, opening),
      credit_limit = coalesce(${o.credit_limit === undefined ? null : n2(o.credit_limit)}, credit_limit),
      note = coalesce(${o.note}, note),
      photo_key = coalesce(${o.photo_key ?? null}, photo_key),
      updated_at = now()
    where id = ${id} and shop_id = ${SHOP_ID} returning *`;
  return c;
}
export async function deleteCustomer(id) {
  await sql`delete from customer where id = ${id} and shop_id = ${SHOP_ID}`;
}

/* ledger — bill + payment together with running balance */
export async function customerLedger(id) {
  const rows = await sql`
    with tx as (
      select c.created_at::date as dt, 0 as seq, 0 as ord,
             'Opening Balance' as descr, c.opening as dr, 0::numeric as cr
      from customer c where c.id = ${id} and c.opening > 0
      union all
      select s.bill_date, 1, s.id,
             'Bill ' || s.bill_no || ' — Credit (Bill Total ' || s.total || ')', s.due, 0
      from sale s where s.customer_id = ${id} and s.is_void = false and s.due > 0
      union all
      select p.pay_date, 2, p.id,
             'Payment Received (' || p.mode || ')' ||
             case when coalesce(p.note,'') <> '' then ' — ' || p.note else '' end, 0, p.amount
      from payment p where p.customer_id = ${id}
    )
    select dt as date, descr as desc, dr, cr,
           sum(dr - cr) over (order by dt, seq, ord
                              rows between unbounded preceding and current row) as bal
    from tx order by dt, seq, ord`;
  return rows;
}

export async function billOutstanding(customerId) {
  return sql`select * from bill_outstanding(${customerId})`;
}

export async function ageingSummary() {
  return sql`select ageing_bucket, sum(balance) as total, count(*) as cnt
             from debtors where shop_id = ${SHOP_ID}
             group by ageing_bucket`;
}

/* ================= ITEMS (rate list) ================= */
export async function listItems(q = '') {
  const like = `%${q.toLowerCase()}%`;
  return q
    ? sql`select * from item where shop_id = ${SHOP_ID} and active
          and (lower(name) like ${like} or lower(code) like ${like} or barcode like ${like})
          order by name limit 100`
    : sql`select * from item where shop_id = ${SHOP_ID} and active order by name`;
}
export async function addItem(o) {
  try {
    const [i] = await sql`
      insert into item (shop_id, code, barcode, name, category, unit, cost_rate, sale_rate, mrp)
      values (${SHOP_ID}, ${o.code}, ${o.barcode || null}, ${o.name}, ${o.category || 'Other'},
              ${o.unit || 'pcs'}, ${n2(o.cost_rate)}, ${n2(o.sale_rate)}, ${n2(o.mrp || o.sale_rate)})
      returning *`;
    return i;
  } catch (e) {
    if (e.message?.includes('uq_item_code')) throw new Error('DUP_CODE');
    if (e.message?.includes('uq_item_barcode')) throw new Error('DUP_BARCODE');
    throw e;
  }
}
export async function updateItem(id, o) {
  try {
    const [i] = await sql`
      update item set
        code = coalesce(${o.code}, code), barcode = ${o.barcode ?? null},
        name = coalesce(${o.name}, name), category = coalesce(${o.category}, category),
        unit = coalesce(${o.unit}, unit),
        cost_rate = coalesce(${o.cost_rate === undefined ? null : n2(o.cost_rate)}, cost_rate),
        sale_rate = coalesce(${o.sale_rate === undefined ? null : n2(o.sale_rate)}, sale_rate),
        mrp = coalesce(${o.mrp === undefined ? null : n2(o.mrp)}, mrp)
      where id = ${id} and shop_id = ${SHOP_ID} returning *`;
    return i;
  } catch (e) {
    if (e.message?.includes('uq_item_code')) throw new Error('DUP_CODE');
    if (e.message?.includes('uq_item_barcode')) throw new Error('DUP_BARCODE');
    throw e;
  }
}
export async function deleteItem(id) {
  await sql`update item set active = false where id = ${id} and shop_id = ${SHOP_ID}`;
}
export async function nextItemCode() {
  const rows = await sql`select code from item where shop_id = ${SHOP_ID}`;
  const used = new Set(rows.map(r => (r.code || '').toUpperCase()));
  let n = 1001; while (used.has('I' + n)) n++;
  return 'I' + n;
}

/* ================= SALES ================= */
export async function createSale(o) {
  const lines = o.items || [];
  if (!lines.length) throw new Error('NO_ITEMS');

  // profit line-wise, cost freeze
  let profit = 0, subtotal = 0;
  const prepared = lines.map(l => {
    const amount = n2(l.qty * l.rate - (l.disc || 0));
    subtotal += amount;
    profit += amount - n2(l.cost_rate) * l.qty;
    return { ...l, amount };
  });
  subtotal = n2(subtotal);
  const total = n2(subtotal - (o.discount || 0));
  const paid = n2(Math.min(o.paid || 0, total));
  const due = n2(total - paid);
  profit = n2(profit - (o.discount || 0));

  const [billNo] = await sql`select next_bill_no(${SHOP_ID}) as no`;
  const [sale] = await sql`
    insert into sale (shop_id, bill_no, customer_id, customer_name, bill_date,
                      subtotal, discount, total, paid, due, pay_mode, profit, note)
    values (${SHOP_ID}, ${billNo.no}, ${o.customer_id || null},
            ${o.customer_name || 'Cash Customer'}, ${o.bill_date || 'today'},
            ${subtotal}, ${n2(o.discount)}, ${total}, ${paid}, ${due},
            ${o.pay_mode}, ${profit}, ${o.note || ''})
    returning *`;

  for (const l of prepared) {
    await sql`insert into sale_item (sale_id, item_id, name, unit, qty, rate, cost_rate, discount, amount)
              values (${sale.id}, ${l.item_id || null}, ${l.name}, ${l.unit || 'pcs'},
                      ${l.qty}, ${n2(l.rate)}, ${n2(l.cost_rate)}, ${n2(l.disc)}, ${l.amount})`;
    if (l.item_id) await sql`update item set last_sold = current_date where id = ${l.item_id}`;
  }
  return sale;
}

export async function listSales(from, to, q = '') {
  const like = `%${q.toLowerCase()}%`;
  return q
    ? sql`select * from sale where shop_id = ${SHOP_ID}
          and bill_date between ${from} and ${to}
          and (lower(bill_no) like ${like} or lower(customer_name) like ${like})
          order by bill_date desc, id desc limit 300`
    : sql`select * from sale where shop_id = ${SHOP_ID}
          and bill_date between ${from} and ${to}
          order by bill_date desc, id desc limit 300`;
}
export async function getSale(id) {
  const [s] = await sql`select * from sale where id = ${id} and shop_id = ${SHOP_ID}`;
  if (!s) return null;
  s.items = await sql`select * from sale_item where sale_id = ${id} order by id`;
  return s;
}
export async function voidSale(id) {
  await sql`update sale set is_void = true, due = 0
            where id = ${id} and shop_id = ${SHOP_ID}`;
}

/* ================= PAYMENTS ================= */
export async function addPayment(o) {
  const [p] = await sql`
    insert into payment (shop_id, customer_id, pay_date, amount, mode, note)
    values (${SHOP_ID}, ${o.customer_id}, ${o.pay_date || 'today'},
            ${n2(o.amount)}, ${o.mode || 'Cash'}, ${o.note || ''})
    returning *`;
  return p;   // bill.due ko chhua tak nahi — FIFO view se nikalta hai
}
export async function listPayments(limit = 200) {
  return sql`select p.*, c.name as customer_name
             from payment p join customer c on c.id = p.customer_id
             where p.shop_id = ${SHOP_ID}
             order by p.pay_date desc, p.id desc limit ${limit}`;
}

/* ================= EXPENSES ================= */
export async function addExpense(o) {
  const [e] = await sql`
    insert into expense (shop_id, exp_date, category, amount, note)
    values (${SHOP_ID}, ${o.exp_date || 'today'}, ${o.category}, ${n2(o.amount)}, ${o.note || ''})
    returning *`;
  return e;
}
export async function listExpenses(limit = 200) {
  return sql`select * from expense where shop_id = ${SHOP_ID}
             order by exp_date desc, id desc limit ${limit}`;
}
export async function deleteExpense(id) {
  await sql`delete from expense where id = ${id} and shop_id = ${SHOP_ID}`;
}

/* ================= REPORTS ================= */
export async function monthlyPL(ym) {
  const [pl] = await sql`select * from monthly_pl
                         where shop_id = ${SHOP_ID} and ym = ${ym}`;
  const [exp] = await sql`select coalesce(sum(amount),0) as total from expense
                          where shop_id = ${SHOP_ID} and to_char(exp_date,'YYYY-MM') = ${ym}`;
  const byCat = await sql`select category, sum(amount) as total from expense
                          where shop_id = ${SHOP_ID} and to_char(exp_date,'YYYY-MM') = ${ym}
                          group by category order by total desc`;
  const [cogs] = await sql`
    select coalesce(sum(si.cost_rate * si.qty),0) as total
    from sale_item si join sale s on s.id = si.sale_id
    where s.shop_id = ${SHOP_ID} and not s.is_void
      and to_char(s.bill_date,'YYYY-MM') = ${ym}`;
  const gross = Number(pl?.gross_profit || 0);
  const expenses = Number(exp.total);
  return {
    ym, bills: Number(pl?.bills || 0), sale: Number(pl?.sale || 0),
    cogs: Number(cogs.total), grossProfit: gross, expenses,
    expByCat: byCat, netProfit: n2(gross - expenses),
    margin: pl?.sale ? n2(gross / Number(pl.sale) * 100) : 0,
    cash: Number(pl?.cash_received || 0), credit: Number(pl?.went_on_credit || 0)
  };
}
export async function last6Months() {
  return sql`
    with months as (
      select to_char(date_trunc('month', current_date) - (n || ' month')::interval, 'YYYY-MM') as ym
      from generate_series(5, 0, -1) n
    )
    select m.ym,
           coalesce(p.sale, 0) as sale,
           coalesce(p.gross_profit, 0) as profit
    from months m
    left join monthly_pl p on p.ym = m.ym and p.shop_id = ${SHOP_ID}
    order by m.ym`;
}
/* poore mahine ka item profit — mahine ki lambai apne aap (28/29/30/31) */
export async function itemProfitMonth(ym) {
  return sql`
    select si.name, sum(si.qty) as qty, sum(si.amount) as sale,
           sum(si.cost_rate * si.qty) as cost,
           sum(si.amount - si.cost_rate * si.qty) as profit
    from sale_item si join sale s on s.id = si.sale_id
    where s.shop_id = ${SHOP_ID} and not s.is_void
      and to_char(s.bill_date, 'YYYY-MM') = ${ym}
    group by si.name order by profit desc limit 50`;
}

export async function itemProfit(from, to) {
  return sql`
    select si.name, sum(si.qty) as qty, sum(si.amount) as sale,
           sum(si.cost_rate * si.qty) as cost,
           sum(si.amount - si.cost_rate * si.qty) as profit
    from sale_item si join sale s on s.id = si.sale_id
    where s.shop_id = ${SHOP_ID} and not s.is_void
      and s.bill_date between ${from} and ${to}
    group by si.name order by profit desc limit 50`;
}

/* ================= DASHBOARD ================= */
export async function dashboard() {
  const [today] = await sql`
    select coalesce(sum(total),0) as sale, coalesce(sum(profit),0) as profit, count(*) as bills
    from sale where shop_id = ${SHOP_ID} and bill_date = current_date and not is_void`;
  const [recv] = await sql`
    select coalesce(sum(balance),0) as total, count(*) as cnt
    from debtors where shop_id = ${SHOP_ID}`;
  const [shop] = await sql`select overdue_days from shop where id = ${SHOP_ID}`;
  const odDays = shop?.overdue_days ?? 30;
  const [od] = await sql`
    select coalesce(sum(balance),0) as total, count(*) as cnt
    from debtors where shop_id = ${SHOP_ID} and days_overdue >= ${odDays}`;
  const topDebtors = await sql`
    select id, name, mobile, photo_key, balance, days_overdue
    from debtors where shop_id = ${SHOP_ID} order by balance desc limit 8`;
  const oldest = await sql`
    select id, name, mobile, photo_key, balance, days_overdue
    from debtors where shop_id = ${SHOP_ID} and days_overdue >= ${odDays}
    order by days_overdue desc limit 8`;
  return { today, recv, od, topDebtors, oldest };
}

/* ================= WEEKLY ================= */
export async function weeklyReport() {
  const shop = await getShop();
  const odDays = shop?.overdue_days ?? 30;
  const medAmt = shop?.thresh_med_amt ?? 2000;
  const medDays = shop?.thresh_med_days ?? 15;
  const highAmt = shop?.thresh_high_amt ?? 10000;
  const highDays = shop?.thresh_high_days ?? 45;

  const allDebtors = await sql`
    select id, name, mobile, photo_key, balance, days_overdue, credit_limit
    from debtors where shop_id = ${SHOP_ID} order by balance desc`;

  const highRisk = allDebtors.filter(c => Number(c.balance) >= highAmt || Number(c.days_overdue) >= highDays);
  const medRisk = allDebtors.filter(c => 
    !highRisk.includes(c) && (Number(c.balance) >= medAmt || Number(c.days_overdue) >= medDays)
  );
  const lowRisk = allDebtors.filter(c => !highRisk.includes(c) && !medRisk.includes(c));

  const overdue = allDebtors.filter(c => Number(c.days_overdue) >= odDays);
  const big = allDebtors.filter(c => Number(c.credit_limit) > 0 && Number(c.balance) > Number(c.credit_limit));

  const newCredit = await sql`
    select bill_no, customer_name, bill_date, due from sale
    where shop_id = ${SHOP_ID} and not is_void and due > 0
      and bill_date >= current_date - 7 order by bill_date desc`;

  return {
    shop,
    allDebtors,
    highRisk,
    medRisk,
    lowRisk,
    overdue,
    big,
    newCredit
  };
}

/* ================= STATS ================= */
export async function stats() {
  const [c] = await sql`select count(*) as n, count(photo_key) as photos
                        from customer where shop_id = ${SHOP_ID}`;
  const [i] = await sql`select count(*) as n from item where shop_id = ${SHOP_ID} and active`;
  const [s] = await sql`select count(*) as n from sale where shop_id = ${SHOP_ID}`;
  const [size] = await sql`select pg_database_size(current_database()) as bytes`;
  return {
    customers: Number(c.n), photos: Number(c.photos),
    items: Number(i.n), sales: Number(s.n),
    dbMB: Math.round(Number(size.bytes) / 1048576 * 10) / 10
  };
}
