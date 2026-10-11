-- ============================================================================
-- 0006_memories_and_songs.sql
-- 1. REMOVE the expense / savings tracking (savings goals, contributions and
--    the per-dream "rough budget" column).
-- 2. ADD a shared photo album (pictures of us, stored privately).
-- 3. ADD our favourite songs list.
-- Security model is unchanged: RLS on every table, membership via is_member(),
-- authorship enforced on insert, media stored in the private dream-media bucket.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Retire the expense / savings feature
-- ---------------------------------------------------------------------------
drop table if exists public.savings_contributions;
drop table if exists public.savings_goals;

alter table public.bucket_list_items drop column if exists estimated_budget;

-- ---------------------------------------------------------------------------
-- 2. Photo album
-- ---------------------------------------------------------------------------
create table if not exists public.memory_photos (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  image_path      text not null,
  caption         text check (caption is null or char_length(caption) <= 300),
  taken_on        date,
  created_by      uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at      timestamptz not null default now()
);

create index if not exists idx_memory_photos_rel on public.memory_photos (relationship_id, taken_on);

alter table public.memory_photos enable row level security;

drop policy if exists memory_photos_select on public.memory_photos;
create policy memory_photos_select on public.memory_photos for select to authenticated
  using (public.is_member(relationship_id));

drop policy if exists memory_photos_insert on public.memory_photos;
create policy memory_photos_insert on public.memory_photos for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists memory_photos_update on public.memory_photos;
create policy memory_photos_update on public.memory_photos for update to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists memory_photos_delete on public.memory_photos;
create policy memory_photos_delete on public.memory_photos for delete to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Our favourite songs
-- ---------------------------------------------------------------------------
create table if not exists public.favorite_songs (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  title           text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  artist          text check (artist is null or char_length(artist) <= 200),
  link            text check (link is null or char_length(link) <= 500),
  note            text check (note is null or char_length(note) <= 500),
  created_by      uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at      timestamptz not null default now()
);

create index if not exists idx_favorite_songs_rel on public.favorite_songs (relationship_id, created_at);

alter table public.favorite_songs enable row level security;

drop policy if exists favorite_songs_select on public.favorite_songs;
create policy favorite_songs_select on public.favorite_songs for select to authenticated
  using (public.is_member(relationship_id));

drop policy if exists favorite_songs_insert on public.favorite_songs;
create policy favorite_songs_insert on public.favorite_songs for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists favorite_songs_update on public.favorite_songs;
create policy favorite_songs_update on public.favorite_songs for update to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists favorite_songs_delete on public.favorite_songs;
create policy favorite_songs_delete on public.favorite_songs for delete to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.memory_photos to authenticated;
grant select, insert, update, delete on public.favorite_songs to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.memory_photos;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.favorite_songs;
exception when duplicate_object then null; end $$;

commit;
