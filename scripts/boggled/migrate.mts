// Applies new Word Brawl migrations (supabase/migrations/*boggled*.sql) to the production database.
// Runs before `next build` on Vercel production deploys, so merging a migration ships it. Each file runs once, in
// a transaction, and is recorded in public.boggled_migrations. Needs SUPABASE_DB_URL (Supabase → Connect →
// Session pooler); without it this is a no-op. Never fails the build unless --strict: the game matters more than stats.
//
//   npx tsx scripts/boggled/migrate.mts            apply pending
//   npx tsx scripts/boggled/migrate.mts --dry-run  list pending
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

const DIR = new URL("../../supabase/migrations/", import.meta.url);
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const url = process.env.SUPABASE_DB_URL;

function done(msg: string, failed = false) {
  console[failed ? "error" : "log"](`[boggled migrate] ${msg}`);
  process.exit(failed && strict ? 1 : 0);
}

if (!url) done("SUPABASE_DB_URL not set, skipping.");
if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") done(`${process.env.VERCEL_ENV} deploy, skipping (production only).`);

const files = readdirSync(DIR)
  .filter((f) => /boggled.*\.sql$/.test(f))
  .sort();

const sql = postgres(url!, { ssl: url!.includes("localhost") || url!.includes("127.0.0.1") ? false : "require", max: 1, prepare: false, connect_timeout: 15, onnotice: () => {} });
try {
  await sql`create table if not exists public.boggled_migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table public.boggled_migrations enable row level security`;
  const applied = new Set((await sql<{ name: string }[]>`select name from public.boggled_migrations`).map((r) => r.name));
  const pending = files.filter((f) => !applied.has(f));
  if (!pending.length) {
    await sql.end();
    done(`up to date (${files.length} migrations).`);
  }
  if (args.has("--dry-run")) {
    await sql.end();
    done(`pending: ${pending.join(", ")}`);
  }
  for (const f of pending) {
    const body = readFileSync(new URL(f, DIR), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public.boggled_migrations (name) values (${f})`;
    });
    console.log(`[boggled migrate] applied ${f}`);
  }
  await sql.end();
  done(`done, ${pending.length} applied.`);
} catch (e) {
  await sql.end({ timeout: 1 }).catch(() => {});
  done(`failed: ${e instanceof Error ? e.message : e}`, true);
}
