// One-time workspace bootstrap for OUR BUCKET LIST.
// Run with: node scripts/setup.mjs
// Reads env from .env.setup (never committed).
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY, RAZAL_EMAIL, JULIAN_EMAIL, RAZAL_PASSWORD, JULIAN_PASSWORD, RAZAL_NAME, JULIAN_NAME } = env;

const sql = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("→ connected to postgres");

await client.query(sql);
console.log("→ migration applied");

// ---- create the two partner accounts via GoTrue admin ----
async function ensureUser(email, password, displayName) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, "Content-Type": "application/json" },
  });
  const { users } = await res.json();
  const existing = (users || []).find((u) => u.email === email);
  if (existing) {
    console.log(`→ user ${email} already exists (${existing.id})`);
    return existing.id;
  }
  const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: displayName } }),
  });
  if (!create.ok) throw new Error(`create user failed: ${create.status} ${await create.text()}`);
  const u = await create.json();
  console.log(`→ created user ${email} (${u.id})`);
  return u.id;
}

const razalId = await ensureUser(RAZAL_EMAIL, RAZAL_PASSWORD, RAZAL_NAME);
const julianId = await ensureUser(JULIAN_EMAIL, JULIAN_PASSWORD, JULIAN_NAME);

// update display names in profiles (in case users pre-existed)
await client.query(
  `insert into public.profiles (id, display_name) values ($1,$2),($3,$4)
   on conflict (id) do update set display_name = excluded.display_name`,
  [razalId, RAZAL_NAME, julianId, JULIAN_NAME]
);

// ---- shared relationship workspace ----
const rel = await client.query(
  `insert into public.relationships (name) values ('Our Little World')
   on conflict do nothing returning id`
);
let relationshipId;
if (rel.rows.length) relationshipId = rel.rows[0].id;
else relationshipId = (await client.query(`select id from public.relationships order by created_at limit 1`)).rows[0].id;
console.log(`→ relationship ${relationshipId}`);

await client.query(
  `insert into public.relationship_members (relationship_id, user_id, role) values ($1,$2,'owner'),($1,$3,'owner')
   on conflict (relationship_id, user_id) do nothing`,
  [relationshipId, razalId, julianId]
);
console.log("→ memberships ensured");

// ---- seed the ten starter categories ----
const cats = [
  ["Firsts Together", "firsts", 1],
  ["Little Everyday Things", "everyday", 2],
  ["Places to Go", "places", 3],
  ["Food & Cooking", "food", 4],
  ["Adventures", "adventures", 5],
  ["Cozy Days", "cozy", 6],
  ["Games & Challenges", "games", 7],
  ["Future Dreams", "future", 8],
  ["Surprises", "surprises", 9],
  ["Other Dreams", "other", 10],
];
for (const [name, icon, sort] of cats) {
  await client.query(
    `insert into public.categories (relationship_id, name, icon, sort_order)
     select $1,$2,$3,$4 where not exists (
       select 1 from public.categories c where c.relationship_id = $1 and c.name = $2)`,
    [relationshipId, name, icon, sort]
  );
}
console.log("→ categories seeded");

await client.end();
console.log("✅ setup complete");
