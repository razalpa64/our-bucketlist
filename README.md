# Our Bucket List 🌿

A private, living storybook for two people — built for **Razal & Julian**, two hearts in two different places
(India ↔ Philippines). Some things are still dreams. That doesn't make them any less ours.

> **Security note:** the Supabase secret key used during this build was pasted into a chat transcript.
> Rotate it in *Supabase Dashboard → Settings → API keys* and update `.env.setup` afterwards.
> The app itself only ever needs the **publishable** key client-side.

---

## What's inside

- **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + motion** (animations, reduced-motion aware)
- **Supabase** — Auth, Postgres with Row Level Security, Realtime, private Storage
- Hand-painted gouache artwork throughout (hero landscape, stamps, chapter vignettes, postcards, botanicals)
- Sections: hero & live summary · dream collection · completed scrapbook · photo album · favourite songs · calendar · time capsule · places map · little notes · closing
- Realtime sync: whatever one partner writes appears on the other's screen within a moment

## The two accounts (this deployment)

| Partner | Email                     | Password    |
| ------- | ------------------------- | ----------- |
| Razal   | `razal@ourbucketlist.app` | `razaljulian` |
| Julian  | `julian@ourbucketlist.app`| `julianrazal` |

Both are members of the single shared workspace **“Our Little World”**.

## Run it

```bash
npm install
cp .env.local.example .env.local   # already present in this repo
npm run dev                        # or: npm run build && npm run start
```

`.env.local` (client-safe, committed-safe):

```
NEXT_PUBLIC_SUPABASE_URL=https://mffkjllwrrjazmaunojg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

## Deploying to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Framework Preset will automatically be detected as **Next.js**.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://mffkjllwrrjazmaunojg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_sFUW0-xVqwp11WoAOcirhA_FHe2gO1U`
4. Click **Deploy**. Vercel will build and host the application automatically.

## Setting the database up from scratch

1. **Create a Supabase project.**
2. **Apply migrations** in order, in the SQL editor (or `psql`):
   - `supabase/migrations/0001_init.sql` — schema, RLS, realtime publication, storage bucket + policies
   - `supabase/migrations/0002_defaults.sql` — `created_by` defaults
   - `supabase/migrations/0003_budget.sql` — estimated budget column (later removed by 0006)
   - `supabase/migrations/0004_features.sql` — time capsule, calendar, doodles
   - `supabase/migrations/0005_fix_rls.sql` — default authorship columns
   - `supabase/migrations/0006_memories_and_songs.sql` — **removes** the savings / expense tracking (tables and the budget column), adds the photo album (`memory_photos`) and favourite songs (`favorite_songs`)
3. **Create `.env.setup`** (never committed; see `.gitignore`):

   ```
   DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
   SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_…
   RAZAL_EMAIL=…
   JULIAN_EMAIL=…
   RAZAL_PASSWORD=…
   JULIAN_PASSWORD=…
   RAZAL_NAME=Razal
   JULIAN_NAME=Julian
   ```

   (Use the *session pooler* connection string from the dashboard; the direct `db.` host is IPv6-only on
   some networks.)
4. **Run the bootstrap once:** `node scripts/setup.mjs`
   It creates both auth users (email pre-confirmed), their profiles, the shared relationship,
   both memberships (role `owner`) and the ten starter categories.
5. **Verify:**
   - `node scripts/verify.mjs` — signs both partners in over the real API and checks RLS:
     cross-partner visibility, spoofed `created_by` rejection (403), per-user favorites,
     completion transitions, sealed surprise notes.
   - `node scripts/realtime-test.mjs` — opens two authenticated websocket sessions and proves
     one partner's insert reaches the other's channel.

## Security model (how privacy is enforced)

- Every private table has **RLS enabled**; all policies funnel through `public.is_member(rel uuid)`,
  a `SECURITY DEFINER` helper — no recursive policy pitfalls.
- **Membership is not writable through the client** (`relationship_members` has only a SELECT policy).
  Partners are added out-of-band (setup script / SQL editor), so nobody can add themselves to a
  relationship or fabricate one.
- `created_by` can never be spoofed: insert policies require `created_by = auth.uid()`.
- Favorites are per-user (`item_favorites` primary key `(item_id, user_id)`); you can only manage your own.
- **Storage** bucket `dream-media` is private; object paths are `{relationship_id}/{user_id}/…`;
  reads require membership of that relationship, writes require being the owning user. The app renders
  media through short-lived signed URLs only.
- **Surprise notes:** a note marked `is_surprise` is invisible to the partner (at the database level)
  until `reveal_at` passes or the author opens it early. The author always sees their own sealed notes.
  (Both partners' non-surprise content is shared by design — this is one shared book.)
- Unauthenticated visitors are redirected to `/login` by middleware; the API is protected by RLS anyway.

## Configurable content

- `src/lib/config.ts` — all display copy, starter dreams, default chapters, artwork mapping.
- Chapters (categories) live in the database and are editable in-app via **“manage chapters”**.
- The featured *dream of the day* is stored on the workspace row and can be changed by either partner
  from any dream's detail view.

## Verified during this build

- ✅ Both accounts sign in; both see the same workspace (PostgREST, real tokens)
- ✅ Spoofed authorship rejected with 403
- ✅ Partner cannot delete the other's favorite (RLS filtered it to zero rows; both favorites survived)
- ✅ Surprise note hidden from partner until reveal date
- ✅ Realtime INSERT delivered across two authenticated websocket sessions
- ✅ `/` redirects unauthenticated visitors to `/login`

Screenshots of every screen (desktop + mobile) were verified in a headless browser during the build.

### Known platform quirk

Shortly after creating accounts or resetting passwords through the admin API, this Supabase project
occasionally stops accepting the password ("Invalid login credentials") for a few minutes. If that
ever happens, run:

```bash
node scripts/reset-passwords.mjs
```

and sign in again. It re-applies both passwords from `.env.setup`.
