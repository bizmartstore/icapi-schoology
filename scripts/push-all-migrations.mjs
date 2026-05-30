/**
 * Applies all SQL files in supabase/migrations/ to the linked database.
 * Set DATABASE_URL in .env (Supabase → Project Settings → Database → URI).
 *
 *   npm run db:push:sql
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const url = process.env.DATABASE_URL;

if (!url?.trim()) {
  console.error(`
Missing DATABASE_URL in .env.

Supabase Dashboard → Project Settings → Database → Connection string (URI).
Example:
  DATABASE_URL="postgresql://postgres.mvxyqbjwnpwcovkarwqa:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

Then run: npm run db:push:sql
`);
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const sql = postgres(url, { max: 1 });

try {
  for (const file of files) {
    const path = join(migrationsDir, file);
    const body = readFileSync(path, "utf8");
    console.log(`Applying ${file}...`);
    await sql.unsafe(body);
    console.log(`  OK`);
  }
  console.log(`\nDone. Applied ${files.length} migration(s).`);
} catch (err) {
  console.error("\nMigration failed:", err.message ?? err);
  process.exit(1);
} finally {
  await sql.end();
}
