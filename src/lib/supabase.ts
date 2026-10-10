import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabase() {
  if (!isConfigured) throw new Error("Supabase environment variables are missing");
  if (!client) client = createBrowserClient(url!, key!);
  return client;
}
