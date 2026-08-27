-- ---------------------------------------------------------------------------
-- Two new default categories: Property and Vehicle
--
-- Two big categories that didn't fit cleanly under Home or Insurance.
-- Property covers rent agreements, sale deeds, tax receipts, HOA docs.
-- Vehicle covers registration, pollution certificates, tolls, insurance.
--
-- This migration does three things, in order:
--   1. Rewrites handle_new_user() so new sign-ups get all thirteen defaults.
--   2. Reslots sort_order on every existing default category so the two new
--      ones can slide in near the top without displacing Identity.
--   3. Backfills Property + Vehicle for every existing profile. ON CONFLICT
--      keeps this safe if someone re-runs it or already made their own.
--
-- Mirror in apps/web/src/lib/data/mock-client.ts is updated in the same
-- commit — the two data modes stay indistinguishable from the UI.
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
    (new.id, 'Property',    'property',    'key-round',       '#B45309', true, 2),
    (new.id, 'Vehicle',     'vehicle',     'car',             '#0D9488', true, 3),
    (new.id, 'Finance',     'finance',     'wallet',          '#059669', true, 4),
    (new.id, 'Insurance',   'insurance',   'shield',          '#0EA5E9', true, 5),
    (new.id, 'Healthcare',  'healthcare',  'heart-pulse',     '#DC2626', true, 6),
    (new.id, 'Education',   'education',   'graduation-cap',  '#7C3AED', true, 7),
    (new.id, 'Work',        'work',        'briefcase',       '#0F766E', true, 8),
    (new.id, 'Travel',      'travel',      'plane',           '#F59E0B', true, 9),
    (new.id, 'Home',        'home',        'house',           '#EA580C', true, 10),
    (new.id, 'Electronics', 'electronics', 'cpu',             '#3B82F6', true, 11),
    (new.id, 'Receipts',    'receipts',    'receipt',         '#64748B', true, 12),
    (new.id, 'Other',       'other',       'file',            '#71717A', true, 99)
  on conflict (user_id, slug) do nothing;

  return new;
end;
$$;

-- 2. Re-number sort_order on existing default categories so Property + Vehicle
--    can slot in at 2 and 3 without stepping on anyone. Untouched columns:
--    is_default = false categories users may have made.
update public.categories
set sort_order = case slug
    when 'identity'    then 1
    when 'property'    then 2
    when 'vehicle'     then 3
    when 'finance'     then 4
    when 'insurance'   then 5
    when 'healthcare'  then 6
    when 'education'   then 7
    when 'work'        then 8
    when 'travel'      then 9
    when 'home'        then 10
    when 'electronics' then 11
    when 'receipts'    then 12
    when 'other'       then 99
    else sort_order
  end
where is_default = true;

-- 3. Backfill Property + Vehicle for every existing profile.
insert into public.categories (user_id, name, slug, icon, color, is_default, sort_order)
select p.user_id, 'Property', 'property', 'key-round', '#B45309', true, 2
from public.profiles p
on conflict (user_id, slug) do nothing;

insert into public.categories (user_id, name, slug, icon, color, is_default, sort_order)
select p.user_id, 'Vehicle', 'vehicle', 'car', '#0D9488', true, 3
from public.profiles p
on conflict (user_id, slug) do nothing;
