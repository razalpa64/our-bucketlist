// End-to-end sanity check against the live project using both partner sessions.
import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { SUPABASE_URL: SB_URL, SUPABASE_SECRET_KEY: SEC, RAZAL_EMAIL, JULIAN_EMAIL, RAZAL_PASSWORD, JULIAN_PASSWORD } = env;
const PUB = "sb_publishable_sFUW0-xVqwp11WoAOcirhA_FHe2gO1U";
const H = (tok) => ({ apikey: PUB, Authorization: `Bearer ${tok}`, "Content-Type": "application/json", Prefer: "return=representation" });

async function signIn(email, password) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: PUB, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`signin ${email}: ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

const razal = await signIn(RAZAL_EMAIL, RAZAL_PASSWORD);
const julian = await signIn(JULIAN_EMAIL, JULIAN_PASSWORD);
console.log("✓ both partners signed in");

const cats = await (await fetch(`${SB_URL}/rest/v1/categories?order=sort_order`, { headers: H(razal) })).json();
console.log(`✓ razal sees ${cats.length} categories`);

const profiles = await (await fetch(`${SB_URL}/rest/v1/profiles?select=id,display_name`, { headers: H(razal) })).json();
console.log("✓ razal sees profiles:", profiles.map((p) => p.display_name).join(", "));

const rel = await (await fetch(`${SB_URL}/rest/v1/relationships?select=id,name`, { headers: H(razal) })).json();
console.log("✓ workspace:", rel[0]?.name, rel[0]?.id);
const relId = rel[0].id;

// razal creates a dream
const item = await (await fetch(`${SB_URL}/rest/v1/bucket_list_items`, {
  method: "POST", headers: H(razal),
  body: JSON.stringify({ relationship_id: relId, title: "verify dream", created_by: undefined }),
})).json();
// note: created_by has a default? no default in schema — client must send it. Get razal id:
const me = await (await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: PUB, Authorization: `Bearer ${razal}` } })).json();
const you = await (await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: PUB, Authorization: `Bearer ${julian}` } })).json();
let created = Array.isArray(item) ? item[0] : null;
if (!created) {
  const r2 = await fetch(`${SB_URL}/rest/v1/bucket_list_items`, {
    method: "POST", headers: H(razal),
    body: JSON.stringify({ relationship_id: relId, title: "verify dream", created_by: me.id }),
  });
  created = (await r2.json())[0];
  console.log("✓ razal created a dream (created_by sent explicitly)");
}

// spoof check: razal tries to author as julian
const spoof = await fetch(`${SB_URL}/rest/v1/bucket_list_items`, {
  method: "POST", headers: H(razal),
  body: JSON.stringify({ relationship_id: relId, title: "spoof", created_by: you.id }),
});
console.log(spoof.status === 403 ? "✓ spoofed created_by rejected (403)" : `✗ spoof returned ${spoof.status}`);

// julian sees it
const seen = await (await fetch(`${SB_URL}/rest/v1/bucket_list_items?id=eq.${created.id}`, { headers: H(julian) })).json();
console.log(seen.length === 1 ? "✓ julian sees razal's dream" : "✗ julian cannot see the dream");

// favorites
await fetch(`${SB_URL}/rest/v1/item_favorites`, { method: "POST", headers: H(razal), body: JSON.stringify({ item_id: created.id, user_id: me.id }) });
const delFav = await fetch(`${SB_URL}/rest/v1/item_favorites?item_id=eq.${created.id}&user_id=eq.${me.id}`, { method: "DELETE", headers: H(julian) });
console.log(delFav.status === 403 || delFav.status === 204 ? `julian deleting razal's favorite → ${delFav.status} (${delFav.status === 403 ? "✓ blocked" : "✗ allowed!"})` : `? ${delFav.status}`);
await fetch(`${SB_URL}/rest/v1/item_favorites`, { method: "POST", headers: H(julian), body: JSON.stringify({ item_id: created.id, user_id: you.id }) });
const favs = await (await fetch(`${SB_URL}/rest/v1/item_favorites?item_id=eq.${created.id}`, { headers: H(julian) })).json();
console.log(favs.length === 2 ? "✓ both favorites stored independently" : `✗ favorites: ${favs.length}`);

// completion transition
const upd = await fetch(`${SB_URL}/rest/v1/bucket_list_items?id=eq.${created.id}`, {
  method: "PATCH", headers: H(julian),
  body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString(), completion_note: "verified" }),
});
console.log(upd.ok ? "✓ julian completed razal's dream" : `✗ complete failed ${upd.status}`);

// notes surprise visibility
const note = await (await fetch(`${SB_URL}/rest/v1/shared_notes`, {
  method: "POST", headers: H(razal),
  body: JSON.stringify({ relationship_id: relId, title: "secret", content: "boo", created_by: me.id, is_surprise: true, reveal_at: new Date(Date.now() + 86400000).toISOString() }),
})).json();
const hidden = await (await fetch(`${SB_URL}/rest/v1/shared_notes?id=eq.${note[0].id}`, { headers: H(julian) })).json();
console.log(hidden.length === 0 ? "✓ surprise note hidden from partner until reveal date" : "✗ surprise leaked");

// cleanup verification rows
await fetch(`${SB_URL}/rest/v1/shared_notes?id=eq.${note[0].id}`, { method: "DELETE", headers: H(razal) });
await fetch(`${SB_URL}/rest/v1/bucket_list_items?id=eq.${created.id}`, { method: "DELETE", headers: H(julian) });
console.log("✓ cleanup done");

// delete probe user
const users = await (await fetch(`${SB_URL}/auth/v1/admin/users?per_page=50`, { headers: { apikey: SEC, Authorization: `Bearer ${SEC}` } })).json();
for (const u of users.users || []) {
  if (u.email === "probe.razal@example.test") {
    await fetch(`${SB_URL}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: { apikey: SEC, Authorization: `Bearer ${SEC}` } });
    console.log("✓ probe user removed");
  }
}
console.log("✅ verification complete");
