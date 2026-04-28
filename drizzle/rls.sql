-- Enable Row Level Security
alter table if exists families enable row level security;
alter table if exists app_users enable row level security;
alter table if exists child_profiles enable row level security;
alter table if exists child_account_links enable row level security;

-- Drop ALL existing policies for idempotent and safe re-runs.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('families', 'app_users', 'child_profiles', 'child_account_links')
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
