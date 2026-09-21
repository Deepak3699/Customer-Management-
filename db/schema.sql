-- =====================================================================
-- Shop Manager Online — Neon Postgres Schema
-- चलाने का तरीका: Neon Console → SQL Editor → paste → Run
--                या: psql "$DATABASE_URL" -f db/schema.sql
--
-- नोट: Supabase वाली RLS यहाँ नहीं है क्योंकि Neon में auth.uid() नहीं होता।
-- सुरक्षा API layer पर है — हर query में shop_id server से आता है,
-- browser से कभी नहीं। (देखें db/queries.js)
-- =====================================================================

-- ---------- 1. दुकान ----------
create table if not exists shop (
  id                serial primary key,
  name              text not null default 'मेरी दुकान',
  address           text,
  mobile            text,
  bill_prefix       text default 'INV',
  next_bill         int  default 1,
  overdue_days      int  default 30,
  thresh_med_amt    numeric(12,2) default 2000,
  thresh_med_days   int  default 15,
  thresh_high_amt   numeric(12,2) default 10000,
  thresh_high_days  int  default 45,
  lang              text default 'hi',
  pin_hash          text,                     -- bcrypt; env से भी आ सकता है
  created_at        timestamptz default now()
);

-- migration if shop already exists
alter table shop add column if not exists thresh_med_amt numeric(12,2) default 2000;
alter table shop add column if not exists thresh_med_days int default 15;
alter table shop add column if not exists thresh_high_amt numeric(12,2) default 10000;
alter table shop add column if not exists thresh_high_days int default 45;

-- ---------- 2. ग्राहक ----------
create table if not exists customer (
  id            serial primary key,
  shop_id       int not null references shop on delete cascade,
  name          text not null,
  mobile        text,
  address       text,
  opening       numeric(12,2) default 0,
  credit_limit  numeric(12,2) default 0,
  note          text,
  photo_key     text,                     -- R2 का object key; फोटो DB में नहीं
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_cust_shop      on customer(shop_id);
create index if not exists idx_cust_shop_name on customer(shop_id, lower(name));
create index if not exists idx_cust_shop_mob  on customer(shop_id, mobile);

-- ---------- 3. रेट लिस्ट (कोई stock नहीं) ----------
create table if not exists item (
  id         serial primary key,
  shop_id    int not null references shop on delete cascade,
  code       text not null,
  barcode    text,
  name       text not null,
  category   text,
  unit       text default 'pcs',
  cost_rate  numeric(12,2) default 0,
  sale_rate  numeric(12,2) not null,
  mrp        numeric(12,2),
  active     boolean default true,
  last_sold  date,
  created_at timestamptz default now(),
  constraint uq_item_code unique (shop_id, code)     -- duplicate code DB पर ही रुकेगा
);
create unique index if not exists uq_item_barcode
  on item(shop_id, barcode) where barcode is not null and barcode <> '';
create index if not exists idx_item_shop_name on item(shop_id, lower(name));

-- ---------- 4. बिल ----------
create table if not exists sale (
  id             serial primary key,
  shop_id        int not null references shop on delete cascade,
  bill_no        text not null,
  customer_id    int references customer on delete set null,
  customer_name  text,
  bill_date      date not null default current_date,
  subtotal       numeric(12,2) default 0,
  discount       numeric(12,2) default 0,
  total          numeric(12,2) not null,
  paid           numeric(12,2) default 0,
  due            numeric(12,2) default 0,   -- IMMUTABLE — कभी update मत करना
  pay_mode       text,
  profit         numeric(12,2) default 0,
  is_void        boolean default false,
  note           text,
  created_at     timestamptz default now(),
  constraint uq_bill_no unique (shop_id, bill_no)
);
create index if not exists idx_sale_shop_date on sale(shop_id, bill_date desc);
create index if not exists idx_sale_due
  on sale(customer_id, bill_date) where due > 0 and is_void = false;

create table if not exists sale_item (
  id         bigserial primary key,
  sale_id    int not null references sale on delete cascade,
  item_id    int references item on delete set null,
  name       text,
  unit       text,
  qty        numeric(12,3) not null,
  rate       numeric(12,2) not null,
  cost_rate  numeric(12,2) default 0,      -- freeze — पुराना profit न बदले
  discount   numeric(12,2) default 0,
  amount     numeric(12,2) not null
);
create index if not exists idx_saleitem_sale on sale_item(sale_id);

-- ---------- 5. भुगतान ----------
create table if not exists payment (
  id          serial primary key,
  shop_id     int not null references shop on delete cascade,
  customer_id int not null references customer on delete cascade,
  pay_date    date not null default current_date,
  amount      numeric(12,2) not null check (amount > 0),
  mode        text default 'Cash',
  note        text,
  created_at  timestamptz default now()
);
create index if not exists idx_pay_cust on payment(customer_id, pay_date);
create index if not exists idx_pay_shop on payment(shop_id, pay_date desc);

-- ---------- 6. खर्च ----------
create table if not exists expense (
  id        serial primary key,
  shop_id   int not null references shop on delete cascade,
  exp_date  date not null default current_date,
  category  text,
  amount    numeric(12,2) not null,
  note      text
);
create index if not exists idx_exp_shop_date on expense(shop_id, exp_date desc);


-- =====================================================================
-- VIEWS — भारी हिसाब DB करेगा
-- =====================================================================

create or replace view customer_balance as
select
  c.id, c.shop_id, c.name, c.mobile, c.photo_key, c.credit_limit, c.note, c.address,
  c.opening
    + coalesce((select sum(s.due) from sale s
                where s.customer_id = c.id and s.is_void = false), 0)
    - coalesce((select sum(p.amount) from payment p
                where p.customer_id = c.id), 0) as balance,
  (select min(s.bill_date) from sale s
   where s.customer_id = c.id and s.is_void = false and s.due > 0) as oldest_due_date
from customer c;

create or replace view debtors as
select
  cb.*,
  coalesce(current_date - cb.oldest_due_date, 0) as days_overdue,
  case
    when coalesce(current_date - cb.oldest_due_date, 0) <= 15 then '0-15'
    when coalesce(current_date - cb.oldest_due_date, 0) <= 30 then '16-30'
    when coalesce(current_date - cb.oldest_due_date, 0) <= 60 then '31-60'
    else '60+'
  end as ageing_bucket
from customer_balance cb
where cb.balance > 0.5;

-- सारे ग्राहक (उधार हो या न हो) — list screen के लिए
create or replace view debtors_all as
select
  cb.*,
  coalesce(current_date - cb.oldest_due_date, 0) as days_overdue,
  case
    when cb.balance <= 0.5 then 'clear'
    when coalesce(current_date - cb.oldest_due_date, 0) <= 15 then '0-15'
    when coalesce(current_date - cb.oldest_due_date, 0) <= 30 then '16-30'
    when coalesce(current_date - cb.oldest_due_date, 0) <= 60 then '31-60'
    else '60+'
  end as ageing_bucket
from customer_balance cb;

create or replace view monthly_pl as
select
  s.shop_id,
  to_char(s.bill_date, 'YYYY-MM') as ym,
  count(*)        as bills,
  sum(s.total)    as sale,
  sum(s.profit)   as gross_profit,
  sum(s.paid)     as cash_received,
  sum(s.due)      as went_on_credit
from sale s
where s.is_void = false
group by s.shop_id, to_char(s.bill_date, 'YYYY-MM');


-- =====================================================================
-- FIFO — किस बिल पर कितना बाकी (bill.due कभी नहीं बदलता)
-- =====================================================================
create or replace function bill_outstanding(p_customer int)
returns table (sale_id int, bill_no text, bill_date date,
               original_due numeric, remaining numeric)
language sql stable as $$
  with pool as (
    select greatest(0,
             coalesce((select sum(amount) from payment where customer_id = p_customer), 0)
             - coalesce((select opening from customer where id = p_customer), 0)
           ) as amt
  ),
  ordered as (
    select s.id, s.bill_no, s.bill_date, s.due,
           sum(s.due) over (order by s.bill_date, s.id
                            rows between unbounded preceding and current row) as running
    from sale s
    where s.customer_id = p_customer and s.is_void = false and s.due > 0
  )
  select o.id, o.bill_no, o.bill_date, o.due,
         greatest(0, least(o.due, o.running - (select amt from pool)))
  from ordered o
  order by o.bill_date, o.id;
$$;

-- अगला बिल नंबर — race-safe (दो device एक साथ बिल बनाएँ तो भी डुप्लिकेट नहीं)
create or replace function next_bill_no(p_shop int)
returns text language plpgsql as $$
declare v_no int; v_pre text;
begin
  update shop set next_bill = next_bill + 1
  where id = p_shop
  returning next_bill - 1, bill_prefix into v_no, v_pre;
  return v_pre || '-' || lpad(v_no::text, 4, '0');
end $$;

-- पहली दुकान (अगर कोई नहीं है)
insert into shop (id, name)
select 1, 'मेरी दुकान'
where not exists (select 1 from shop);
select setval('shop_id_seq', greatest((select max(id) from shop), 1));
