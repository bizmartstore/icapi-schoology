import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;

if (!url) {
  console.error(`
Missing DATABASE_URL in environment.

Add your Supabase database URI to .env (Project Settings → Database → Connection string):
  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

Then run: npm run setup:banners
`);
  process.exit(1);
}

const sql = readFileSync(
  join(root, "supabase/migrations/20260530120000_banners_storage_bucket.sql"),
  "utf8",
);

const db = postgres(url, { max: 1 });

try {
  await db.unsafe(sql);
  console.log("Banners storage bucket and policies applied successfully.");
} catch (err) {
  console.error("Failed to apply banners storage setup:", err.message ?? err);
  process.exit(1);
} finally {
  await db.end();
}
