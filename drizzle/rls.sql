-- Enable Row Level Security
alter table if exists families enable row level security;
alter table if exists app_users enable row level security;
alter table if exists child_profiles enable row level security;
alter table if exists child_account_links enable row level security;
alter table if exists shopping_lists enable row level security;

-- Drop ALL existing policies for idempotent and safe re-runs.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('families', 'app_users', 'child_profiles', 'child_account_links', 'shopping_lists')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- families
create policy families_select_authenticated
on families
for select
to authenticated
using (true);

create policy families_insert_authenticated
on families
for insert
to authenticated
with check (true);

-- app_users
create policy app_users_select_self
on app_users
for select
to authenticated
using (id = auth.uid()::text);

create policy app_users_insert_self
on app_users
for insert
to authenticated
with check (id = auth.uid()::text);

create policy app_users_update_self
on app_users
for update
to authenticated
using (id = auth.uid()::text)
with check (id = auth.uid()::text);

-- child_profiles
create policy child_profiles_select_same_family
on child_profiles
for select
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = child_profiles.family_id
  )
);

create policy child_profiles_insert_parent_only
on child_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id = child_profiles.family_id
  )
);

create policy child_profiles_update_parent_only
on child_profiles
for update
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id = child_profiles.family_id
  )
)
with check (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id = child_profiles.family_id
  )
);

create policy child_profiles_delete_parent_only
on child_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id = child_profiles.family_id
  )
);

-- child_account_links
create policy child_account_links_select_same_family
on child_account_links
for select
to authenticated
using (
  exists (
    select 1
    from child_profiles cp
    join app_users me on me.family_id = cp.family_id
    where cp.id = child_account_links.child_id
      and me.id = auth.uid()::text
  )
);

create policy child_account_links_insert_parent_only
on child_account_links
for insert
to authenticated
with check (
  exists (
    select 1
    from child_profiles cp
    join app_users me on me.family_id = cp.family_id
    where cp.id = child_account_links.child_id
      and me.id = auth.uid()::text
      and me.role = 'parent'
  )
);

create policy child_account_links_delete_parent_only
on child_account_links
for delete
to authenticated
using (
  exists (
    select 1
    from child_profiles cp
    join app_users me on me.family_id = cp.family_id
    where cp.id = child_account_links.child_id
      and me.id = auth.uid()::text
      and me.role = 'parent'
  )
);

-- shopping_lists
create policy shopping_lists_select_same_family
on shopping_lists
for select
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = shopping_lists.family_id
  )
);

create policy shopping_lists_insert_same_family
on shopping_lists
for insert
to authenticated
with check (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = shopping_lists.family_id
  )
);

create policy shopping_lists_update_same_family
on shopping_lists
for update
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = shopping_lists.family_id
  )
)
with check (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = shopping_lists.family_id
  )
);

create policy shopping_lists_delete_same_family
on shopping_lists
for delete
to authenticated
using (
  exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.family_id = shopping_lists.family_id
  )
);

-- RPC helper to list/search accounts within the authenticated user's family.
-- SECURITY DEFINER is required to avoid recursive RLS reads on app_users.
create or replace function public.get_my_family_member_accounts(search_query text default '')
returns table (
  id text,
  email text,
  display_name text,
  provider auth_provider,
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select family_id
    from app_users
    where id = auth.uid()::text
    limit 1
  )
  select
    u.id,
    u.email,
    u.display_name,
    u.provider,
    u.last_seen_at
  from app_users u
  join me on me.family_id is not null and u.family_id = me.family_id
  where auth.uid() is not null
    and (
      coalesce(search_query, '') = ''
      or u.email ilike ('%' || search_query || '%')
    )
  order by u.last_seen_at desc
  limit 50;
$$;

revoke all on function public.get_my_family_member_accounts(text) from public;
grant execute on function public.get_my_family_member_accounts(text) to authenticated;

-- Securely link an account to a child profile and propagate family_id to that account.
-- Used by parents in Gestione Figli.
create or replace function public.link_account_to_child_secure(
  child_profile_id uuid,
  user_account_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id text := auth.uid()::text;
  actor_family_id uuid;
  actor_role user_role;
  target_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select family_id, role
  into actor_family_id, actor_role
  from app_users
  where id = actor_id
  limit 1;

  if actor_family_id is null or actor_role <> 'parent' then
    raise exception 'only parents with a family can link accounts';
  end if;

  select family_id
  into target_family_id
  from child_profiles
  where id = child_profile_id
  limit 1;

  if target_family_id is null then
    raise exception 'child profile not found';
  end if;

  if target_family_id <> actor_family_id then
    raise exception 'cannot link account outside your family';
  end if;

  insert into child_account_links (child_id, user_id)
  values (child_profile_id, user_account_id)
  on conflict (child_id, user_id) do nothing;

  update app_users
  set
    family_id = actor_family_id,
    role = coalesce(role, 'child'),
    last_seen_at = now()
  where id = user_account_id
    and (family_id is null or family_id = actor_family_id);
end;
$$;

revoke all on function public.link_account_to_child_secure(uuid, text) from public;
grant execute on function public.link_account_to_child_secure(uuid, text) to authenticated;
