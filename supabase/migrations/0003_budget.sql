alter table public.bucket_list_items add column if not exists estimated_budget numeric check (estimated_budget is null or estimated_budget >= 0);
