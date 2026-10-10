// One-command recovery if sign-in ever reports "Invalid login credentials":
//   node scripts/reset-passwords.mjs
// Reads emails + passwords from .env.setup and re-applies them via the admin API.
import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { SUPABASE_URL, SUPABASE_SECRET_KEY: SEC, RAZAL_EMAIL, JULIAN_EMAIL, RAZAL_PASSWORD, JULIAN_PASSWORD } = env;

const users = await (await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, { headers: { apikey: SEC, Authorization: `Bearer ${SEC}` } })).json();
for (const [email, password] of [[RAZAL_EMAIL, RAZAL_PASSWORD], [JULIAN_EMAIL, JULIAN_PASSWORD]]) {
  const u = (users.users || []).find((x) => x.email === email);
  if (!u) {
    console.log(`! ${email} not found`);
    continue;
  }
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
    method: "PUT",
    headers: { apikey: SEC, Authorization: `Bearer ${SEC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  console.log(`${email} -> ${r.status}`);
}
console.log("done — try signing in again");
