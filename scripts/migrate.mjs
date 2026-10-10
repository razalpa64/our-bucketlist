import { readFileSync } from "node:fs";
import pg from "pg";

const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { DATABASE_URL } = env;
const sql = readFileSync(new URL("../supabase/migrations/0004_features.sql", import.meta.url), "utf8");

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("→ connected to Supabase Postgres");

await client.query(sql);
console.log("✓ migration 0004_features.sql applied successfully");

await client.end();
