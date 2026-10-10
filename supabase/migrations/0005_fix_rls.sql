-- 0005_fix_rls.sql
-- Set default auth.uid() on created_by / user_id columns for new tables
-- to prevent RLS violations when inserting without explicit user ID.

begin;

alter table public.future_letters
  alter column created_by set default auth.uid();

alter table public.savings_goals
  alter column created_by set default auth.uid();

alter table public.savings_contributions
  alter column user_id set default auth.uid();

alter table public.calendar_plans
  alter column created_by set default auth.uid();

commit;
