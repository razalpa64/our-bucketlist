// Two authenticated sessions, one websocket each: razal writes, julian must hear it.
import { readFileSync } from "node:fs";
import { WebSocket as WS } from "ws";
globalThis.WebSocket = WS;

const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { SUPABASE_URL, RAZAL_EMAIL, JULIAN_EMAIL, RAZAL_PASSWORD, JULIAN_PASSWORD } = env;
const PUB = "sb_publishable_sFUW0-xVqwp11WoAOcirhA_FHe2gO1U";

const { createClient } = await import("@supabase/supabase-js");

async function sessionClient(email, password) {
  const c = createClient(SUPABASE_URL, PUB, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { c, userId: data.user.id };
}

const razal = await sessionClient(RAZAL_EMAIL, RAZAL_PASSWORD);
const julian = await sessionClient(JULIAN_EMAIL, JULIAN_PASSWORD);

const rel = await julian.c.from("relationships").select("id").limit(1).single();
const relId = rel.data.id;

let received = null;
const done = new Promise((res) => {
  julian.c
    .channel("rt-test")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "bucket_list_items", filter: `relationship_id=eq.${relId}` }, (p) => {
      received = p.new;
      res();
    })
    .subscribe();
});

await new Promise((r) => setTimeout(r, 2500)); // let julian's channel subscribe

const title = `realtime proof ${Date.now()}`;
const ins = await razal.c.from("bucket_list_items").insert({ relationship_id: relId, title, created_by: razal.userId }).select().single();
if (ins.error) throw ins.error;

const winner = await Promise.race([done, new Promise((r) => setTimeout(() => r(null), 12000))]);

if (received && received.title === title) {
  console.log("✓ REALTIME SYNC VERIFIED: julian's client received razal's insert over the socket:", received.title);
} else {
  console.log("✗ realtime event not received in 12s");
  process.exitCode = 1;
}

await razal.c.from("bucket_list_items").delete().eq("id", ins.data.id);
process.exit(process.exitCode ?? 0);
