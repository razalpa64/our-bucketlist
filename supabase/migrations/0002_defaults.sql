alter table public.bucket_list_items alter column created_by set default auth.uid();
alter table public.locations alter column created_by set default auth.uid();
alter table public.shared_notes alter column created_by set default auth.uid();
