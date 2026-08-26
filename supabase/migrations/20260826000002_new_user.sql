-- ---------------------------------------------------------------------------
-- New account bootstrap
--
-- A new vault is never empty of structure: the profile row and the eleven
-- default categories are created in the same transaction as the auth user, so
-- the first page load after sign-up already has something to show.
--
-- This mirrors DEFAULT_CATEGORIES in apps/web/src/lib/data/mock-client.ts.
-- If you change one, change the other — the two data modes are meant to be
-- indistinguishable from the UI.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, slug, icon, color, is_default, sort_order)
  values
    (new.id, 'Identity',    'identity',    'id-card',         '#6366F1', true, 1),
    (new.id, 'Finance',     'finance',     'wallet',          '#059669', true, 2),
    (new.id, 'Insurance',   'insurance',   'shield',          '#0EA5E9', true, 3),
    (new.id, 'Healthcare',  'healthcare',  'heart-pulse',     '#DC2626', true, 4),
    (new.id, 'Education',   'education',   'graduation-cap',  '#7C3AED', true, 5),
    (new.id, 'Work',        'work',        'briefcase',       '#0F766E', true, 6),
    (new.id, 'Travel',      'travel',      'plane',           '#F59E0B', true, 7),
    (new.id, 'Home',        'home',        'house',           '#EA580C', true, 8),
    (new.id, 'Electronics', 'electronics', 'cpu',             '#3B82F6', true, 9),
    (new.id, 'Receipts',    'receipts',    'receipt',         '#64748B', true, 10),
    (new.id, 'Other',       'other',       'file',            '#71717A', true, 99)
  on conflict (user_id, slug) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
