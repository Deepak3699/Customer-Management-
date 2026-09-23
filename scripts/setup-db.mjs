/* Executes schema.sql on Neon database */
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { splitSql } from '../lib/splitSql.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error('❌ DATABASE_URL not found (check .env.local)'); process.exit(1); }
const sql = neon(url);
const text = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');

const stmts = splitSql(text);
console.log(`Running ${stmts.length} statements...`);
let ok = 0;
for (const st of stmts) {
  try {
    await sql(st);
    ok++;
  } catch (e) {
    console.error('⚠ ', e.message, '\n   ', st.slice(0, 70));
  }
}
console.log(`✅ ${ok}/${stmts.length} statements completed successfully`);
