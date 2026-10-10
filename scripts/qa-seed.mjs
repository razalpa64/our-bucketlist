// Temporary QA data (prefixed "QA·") so populated layouts can be visually checked.
// Usage: node scripts/qa-seed.mjs seed | clean
import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { SUPABASE_URL: SB, RAZAL_EMAIL, JULIAN_EMAIL, RAZAL_PASSWORD, JULIAN_PASSWORD } = env;
const PUB = "sb_publishable_sFUW0-xVqwp11WoAOcirhA_FHe2gO1U";

async function client(email, password) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  return { tok: j.access_token, id: j.user.id };
}
const H = (t) => ({ apikey: PUB, Authorization: `Bearer ${t}`, "Content-Type": "application/json", Prefer: "return=representation" });
const mode = process.argv[2];

const razal = await client(RAZAL_EMAIL, RAZAL_PASSWORD);
const julian = await client(JULIAN_EMAIL, JULIAN_PASSWORD);

if (mode === "clean") {
  for (const [table, col] of [["bucket_list_items", "title"], ["locations", "name"], ["shared_notes", "title"]]) {
    const rows = await (await fetch(`${SB}/rest/v1/${table}?${col}=like.QA·*`, { headers: H(razal.tok) })).json();
    for (const row of rows) await fetch(`${SB}/rest/v1/${table}?id=eq.${row.id}`, { method: "DELETE", headers: H(razal.tok) });
    console.log(`cleaned ${rows.length} ${table}`);
  }
  process.exit(0);
}

const rel = await (await fetch(`${SB}/rest/v1/relationships?select=id`, { headers: H(razal.tok) })).json();
const relId = rel[0].id;
const cats = await (await fetch(`${SB}/rest/v1/categories?select=id,icon`, { headers: H(razal.tok) })).json();
const C = (icon) => cats.find((c) => c.icon === icon)?.id ?? null;

const dreams = [
  { title: "QA· Meet each other in person for the very first time", description: "The airport hug that has been three years in the making.", category_id: C("firsts"), priority: "soon", tags: ["the big one"], location_name: "Singapore" },
  { title: "QA· Watch the sunset together", description: "Somewhere quiet, with snacks.", category_id: C("cozy"), priority: "whenever" },
  { title: "QA· Cook a meal together", description: "Adobo one half, biryani the other.", category_id: C("food"), priority: "whenever", private_note: "I already know you'll make it too spicy and I'll pretend to complain." },
  { title: "QA· Play chess sitting beside each other", category_id: C("games"), priority: "someday" },
  { title: "QA· Take a train journey", description: "Window seats, shared earphones, a playlist we made.", category_id: C("adventures"), priority: "someday", tags: ["slow travel"], estimated_budget: 120 },
  { title: "QA· Have a little picnic", category_id: C("food"), priority: "whenever", status: "planned", location_name: "Camiguin" },
];

for (const d of dreams) {
  await fetch(`${SB}/rest/v1/bucket_list_items`, { method: "POST", headers: H(razal.tok), body: JSON.stringify({ ...d, relationship_id: relId }) });
}
// one completed dream, authored by julian
await fetch(`${SB}/rest/v1/bucket_list_items`, {
  method: "POST", headers: H(julian.tok),
  body: JSON.stringify({ relationship_id: relId, title: "QA· Exchange handwritten letters", category_id: C("surprises"), priority: "whenever", status: "completed", completed_at: new Date().toISOString(), completion_note: "Yours arrived on a Tuesday. I read it four times." }),
});

const items = await (await fetch(`${SB}/rest/v1/bucket_list_items?title=like.QA·*&select=id,title`, { headers: H(razal.tok) })).json();
const meet = items.find((i) => i.title.includes("Meet each other"));
await fetch(`${SB}/rest/v1/item_favorites`, { method: "POST", headers: H(razal.tok), body: JSON.stringify({ item_id: meet.id, user_id: razal.id }) });
await fetch(`${SB}/rest/v1/item_favorites`, { method: "POST", headers: H(julian.tok), body: JSON.stringify({ item_id: meet.id, user_id: julian.id }) });

await fetch(`${SB}/rest/v1/locations`, {
  method: "POST", headers: H(razal.tok),
  body: JSON.stringify({ relationship_id: relId, name: "Camiguin", country: "Philippines", description: "An island Julian keeps describing until it feels like a memory already.", status: "planned" }),
});
await fetch(`${SB}/rest/v1/locations`, {
  method: "POST", headers: H(razal.tok),
  body: JSON.stringify({ relationship_id: relId, name: "Munnar", country: "India", description: "Tea hills and cold mornings and one shared umbrella.", status: "dreaming" }),
});

await fetch(`${SB}/rest/v1/shared_notes`, {
  method: "POST", headers: H(razal.tok),
  body: JSON.stringify({ relationship_id: relId, title: "QA· A reminder", content: "Distance is just the cover of our book, not the story.", created_by: razal.id }),
});

console.log("QA data seeded:", items.length + 1, "dreams");
