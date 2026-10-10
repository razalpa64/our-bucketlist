-- ============================================================================
-- OUR BUCKET LIST — initial schema
-- A private shared storybook for two partners.
-- Security model: every private table is RLS-protected; membership is checked
-- through a SECURITY DEFINER helper so policies never recurse.
-- Membership rows are managed out-of-band (setup script / SQL editor), never
-- by the client.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table if not exists public.relationships (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default 'Our Little World',
  featured_item_id uuid,
  created_at       timestamptz not null default now()
);

create table if not exists public.relationship_members (
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null default 'partner' check (role in ('partner', 'owner')),
  created_at      timestamptz not null default now(),
  primary key (relationship_id, user_id)
);

create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  name            text not null check (char_length(trim(name)) > 0),
  icon            text not null default 'other',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.bucket_list_items (
  id                    uuid primary key default gen_random_uuid(),
  relationship_id       uuid not null references public.relationships (id) on delete cascade,
  title                 text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  description           text,
  category_id           uuid references public.categories (id) on delete set null,
  priority              text not null default 'whenever' check (priority in ('whenever', 'soon', 'someday')),
  status                text not null default 'dreaming' check (status in ('dreaming', 'planned', 'completed')),
  created_by            uuid not null references auth.users (id) on delete restrict,
  location_name         text,
  target_date           date,
  completed_at          timestamptz,
  completion_note       text,
  completion_image_path text,
  image_path            text,
  private_note          text,
  tags                  text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.relationships
  add constraint relationships_featured_item_fkey
  foreign key (featured_item_id) references public.bucket_list_items (id) on delete set null;

create table if not exists public.item_favorites (
  item_id    uuid not null references public.bucket_list_items (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.locations (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  name            text not null check (char_length(trim(name)) > 0 and char_length(name) <= 140),
  country         text,
  description     text,
  map_url         text,
  latitude        numeric,
  longitude       numeric,
  target_date     date,
  status          text not null default 'dreaming' check (status in ('dreaming', 'planned', 'visited')),
  image_path      text,
  created_by      uuid not null references auth.users (id) on delete restrict,
  created_at      timestamptz not null default now()
);

create table if not exists public.shared_notes (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  title           text not null check (char_length(trim(title)) > 0 and char_length(title) <= 140),
  content         text not null default '',
  created_by      uuid not null references auth.users (id) on delete restrict,
  reveal_at       timestamptz,
  is_surprise     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_members_user on public.relationship_members (user_id);
create index if not exists idx_categories_rel on public.categories (relationship_id, sort_order);
create index if not exists idx_items_rel on public.bucket_list_items (relationship_id);
create index if not exists idx_items_category on public.bucket_list_items (category_id);
create index if not exists idx_items_status on public.bucket_list_items (status);
create index if not exists idx_favorites_user on public.item_favorites (user_id);
create index if not exists idx_locations_rel on public.locations (relationship_id);
create index if not exists idx_notes_rel on public.shared_notes (relationship_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_items_touch on public.bucket_list_items;
create trigger trg_items_touch before update on public.bucket_list_items
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_notes_touch on public.shared_notes;
create trigger trg_notes_touch before update on public.shared_notes
  for each row execute function public.touch_updated_at();

-- Auto-create a profile whenever an auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership check used by every policy. SECURITY DEFINER so reading
-- relationship_members inside a policy on another table cannot recurse.
create or replace function public.is_member(rel uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.relationship_members rm
    where rm.relationship_id = rel and rm.user_id = auth.uid()
  );
$$;

create or replace function public.member_relationship_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select rm.relationship_id from public.relationship_members rm where rm.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.relationships enable row level security;
alter table public.relationship_members enable row level security;
alter table public.categories enable row level security;
alter table public.bucket_list_items enable row level security;
alter table public.item_favorites enable row level security;
alter table public.locations enable row level security;
alter table public.shared_notes enable row level security;

-- profiles: you see yourself and anyone who shares a relationship with you.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.relationship_members mine
    join public.relationship_members theirs using (relationship_id)
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- relationships: members can read and rename / set the featured dream.
drop policy if exists relationships_select on public.relationships;
create policy relationships_select on public.relationships for select to authenticated
  using (public.is_member(id));
drop policy if exists relationships_update on public.relationships;
create policy relationships_update on public.relationships for update to authenticated
  using (public.is_member(id));

-- membership: readable by members; never writable through the client.
drop policy if exists members_select on public.relationship_members;
create policy members_select on public.relationship_members for select to authenticated
  using (user_id = auth.uid() or public.is_member(relationship_id));

-- categories: full member control (the couple curates their own categories).
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to authenticated
  using (public.is_member(relationship_id));
drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories for insert to authenticated
  with check (public.is_member(relationship_id));
drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories for update to authenticated
  using (public.is_member(relationship_id));
drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories for delete to authenticated
  using (public.is_member(relationship_id));

-- bucket list items: members read/write; authorship cannot be spoofed.
drop policy if exists items_select on public.bucket_list_items;
create policy items_select on public.bucket_list_items for select to authenticated
  using (public.is_member(relationship_id));
drop policy if exists items_insert on public.bucket_list_items;
create policy items_insert on public.bucket_list_items for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());
drop policy if exists items_update on public.bucket_list_items;
create policy items_update on public.bucket_list_items for update to authenticated
  using (public.is_member(relationship_id));
drop policy if exists items_delete on public.bucket_list_items;
create policy items_delete on public.bucket_list_items for delete to authenticated
  using (public.is_member(relationship_id));

-- favorites: only the owner manages their own; readable inside the workspace.
drop policy if exists favorites_select on public.item_favorites;
create policy favorites_select on public.item_favorites for select to authenticated using (
  exists (
    select 1 from public.bucket_list_items i
    where i.id = item_id and public.is_member(i.relationship_id)
  )
);
drop policy if exists favorites_insert on public.item_favorites;
create policy favorites_insert on public.item_favorites for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.bucket_list_items i
    where i.id = item_id and public.is_member(i.relationship_id)
  )
);
drop policy if exists favorites_delete on public.item_favorites;
create policy favorites_delete on public.item_favorites for delete to authenticated
  using (user_id = auth.uid());

-- locations: same member model as items.
drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations for select to authenticated
  using (public.is_member(relationship_id));
drop policy if exists locations_insert on public.locations;
create policy locations_insert on public.locations for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());
drop policy if exists locations_update on public.locations;
create policy locations_update on public.locations for update to authenticated
  using (public.is_member(relationship_id));
drop policy if exists locations_delete on public.locations;
create policy locations_delete on public.locations for delete to authenticated
  using (public.is_member(relationship_id));

-- shared notes: members read non-surprises (and their own / revealed surprises);
-- only the author edits or deletes; surprises stay sealed until reveal_at.
drop policy if exists notes_select on public.shared_notes;
create policy notes_select on public.shared_notes for select to authenticated using (
  public.is_member(relationship_id)
  and (
    not is_surprise
    or created_by = auth.uid()
    or (reveal_at is not null and reveal_at <= now())
  )
);
drop policy if exists notes_insert on public.shared_notes;
create policy notes_insert on public.shared_notes for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());
drop policy if exists notes_update on public.shared_notes;
create policy notes_update on public.shared_notes for update to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());
drop policy if exists notes_delete on public.shared_notes;
create policy notes_delete on public.shared_notes for delete to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants for PostgREST roles
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, update on public.relationships to authenticated;
grant select on public.relationship_members to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.bucket_list_items to authenticated;
grant select, insert, delete on public.item_favorites to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.shared_notes to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.member_relationship_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.bucket_list_items;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.item_favorites;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.locations;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.shared_notes;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.relationships;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Storage: one private bucket, paths shaped like {relationship_id}/{user_id}/…
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('dream-media', 'dream-media', false)
on conflict (id) do nothing;

drop policy if exists media_select on storage.objects;
create policy media_select on storage.objects for select to authenticated using (
  bucket_id = 'dream-media'
  and public.is_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'dream-media'
  and public.is_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated using (
  bucket_id = 'dream-media'
  and public.is_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated using (
  bucket_id = 'dream-media'
  and (storage.foldername(name))[2] = auth.uid()::text
);

commit;
