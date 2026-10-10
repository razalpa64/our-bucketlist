-- ============================================================================
-- 0004_features.sql
-- 1. Letters to our future selves (securely sealed with database-level RLS)
-- 2. Dreams we're saving for (multi-currency savings goals & contributions)
-- 3. Our someday calendar (tentative plans vs confirmed bookings)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Letters to our future selves
-- ---------------------------------------------------------------------------
create table if not exists public.future_letters (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  created_by      uuid not null references auth.users (id) on delete restrict,
  title           text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  content         text not null default '',
  reveal_at       timestamptz not null,
  delivery_years  integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_future_letters_rel on public.future_letters (relationship_id);
create index if not exists idx_future_letters_reveal on public.future_letters (reveal_at);

drop trigger if exists trg_future_letters_touch on public.future_letters;
create trigger trg_future_letters_touch before update on public.future_letters
  for each row execute function public.touch_updated_at();

alter table public.future_letters enable row level security;

-- Only author can read while sealed; once reveal_at passes, both partners in the relationship can read
drop policy if exists future_letters_select on public.future_letters;
create policy future_letters_select on public.future_letters for select to authenticated using (
  public.is_member(relationship_id)
  and (
    created_by = auth.uid()
    or reveal_at <= now()
  )
);

drop policy if exists future_letters_insert on public.future_letters;
create policy future_letters_insert on public.future_letters for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists future_letters_update on public.future_letters;
create policy future_letters_update on public.future_letters for update to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists future_letters_delete on public.future_letters;
create policy future_letters_delete on public.future_letters for delete to authenticated
  using (public.is_member(relationship_id) and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Dreams we're saving for (savings goals & contributions)
-- ---------------------------------------------------------------------------
create table if not exists public.savings_goals (
  id                    uuid primary key default gen_random_uuid(),
  relationship_id       uuid not null references public.relationships (id) on delete cascade,
  bucket_list_item_id   uuid references public.bucket_list_items (id) on delete set null,
  title                 text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  target_amount         numeric not null check (target_amount > 0),
  currency              text not null default 'INR' check (currency in ('INR', 'PHP', 'USD', 'EUR', 'GBP')),
  category              text not null default 'tickets' check (category in ('tickets', 'trip', 'experience', 'stay', 'special')),
  notes                 text,
  created_by            uuid not null references auth.users (id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_savings_goals_rel on public.savings_goals (relationship_id);

drop trigger if exists trg_savings_goals_touch on public.savings_goals;
create trigger trg_savings_goals_touch before update on public.savings_goals
  for each row execute function public.touch_updated_at();

alter table public.savings_goals enable row level security;

drop policy if exists savings_goals_select on public.savings_goals;
create policy savings_goals_select on public.savings_goals for select to authenticated
  using (public.is_member(relationship_id));

drop policy if exists savings_goals_insert on public.savings_goals;
create policy savings_goals_insert on public.savings_goals for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists savings_goals_update on public.savings_goals;
create policy savings_goals_update on public.savings_goals for update to authenticated
  using (public.is_member(relationship_id));

drop policy if exists savings_goals_delete on public.savings_goals;
create policy savings_goals_delete on public.savings_goals for delete to authenticated
  using (public.is_member(relationship_id));

create table if not exists public.savings_contributions (
  id              uuid primary key default gen_random_uuid(),
  goal_id         uuid not null references public.savings_goals (id) on delete cascade,
  relationship_id uuid not null references public.relationships (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  amount          numeric not null check (amount > 0),
  currency        text not null check (currency in ('INR', 'PHP', 'USD', 'EUR', 'GBP')),
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_savings_contributions_goal on public.savings_contributions (goal_id);
create index if not exists idx_savings_contributions_rel on public.savings_contributions (relationship_id);

alter table public.savings_contributions enable row level security;

drop policy if exists savings_contrib_select on public.savings_contributions;
create policy savings_contrib_select on public.savings_contributions for select to authenticated
  using (public.is_member(relationship_id));

drop policy if exists savings_contrib_insert on public.savings_contributions;
create policy savings_contrib_insert on public.savings_contributions for insert to authenticated
  with check (public.is_member(relationship_id) and user_id = auth.uid());

drop policy if exists savings_contrib_delete on public.savings_contributions;
create policy savings_contrib_delete on public.savings_contributions for delete to authenticated
  using (public.is_member(relationship_id) and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Our someday calendar
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_plans (
  id                  uuid primary key default gen_random_uuid(),
  relationship_id     uuid not null references public.relationships (id) on delete cascade,
  bucket_list_item_id uuid references public.bucket_list_items (id) on delete set null,
  title               text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  start_date          date not null,
  end_date            date,
  plan_type           text not null default 'tentative' check (plan_type in ('tentative', 'confirmed', 'anniversary', 'trip')),
  location            text,
  notes               text,
  created_by          uuid not null references auth.users (id) on delete restrict,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_calendar_plans_rel on public.calendar_plans (relationship_id);
create index if not exists idx_calendar_plans_dates on public.calendar_plans (start_date);

drop trigger if exists trg_calendar_plans_touch on public.calendar_plans;
create trigger trg_calendar_plans_touch before update on public.calendar_plans
  for each row execute function public.touch_updated_at();

alter table public.calendar_plans enable row level security;

drop policy if exists calendar_plans_select on public.calendar_plans;
create policy calendar_plans_select on public.calendar_plans for select to authenticated
  using (public.is_member(relationship_id));

drop policy if exists calendar_plans_insert on public.calendar_plans;
create policy calendar_plans_insert on public.calendar_plans for insert to authenticated
  with check (public.is_member(relationship_id) and created_by = auth.uid());

drop policy if exists calendar_plans_update on public.calendar_plans;
create policy calendar_plans_update on public.calendar_plans for update to authenticated
  using (public.is_member(relationship_id));

drop policy if exists calendar_plans_delete on public.calendar_plans;
create policy calendar_plans_delete on public.calendar_plans for delete to authenticated
  using (public.is_member(relationship_id));

-- Add doodle column to completed dreams if not existing
alter table public.bucket_list_items
  add column if not exists doodle text default 'flower';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.future_letters to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert, update, delete on public.savings_contributions to authenticated;
grant select, insert, update, delete on public.calendar_plans to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime publications
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.future_letters;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.savings_goals;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.savings_contributions;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.calendar_plans;
exception when duplicate_object then null; when others then null; end $$;

commit;
