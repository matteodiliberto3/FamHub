-- Enable Row Level Security
alter table if exists families enable row level security;
alter table if exists app_users enable row level security;
alter table if exists child_profiles enable row level security;
alter table if exists child_account_links enable row level security;

-- Drop policies for idempotent re-runs
drop policy if exists families_select_member on families;
drop policy if exists families_insert_authenticated on families;

drop policy if exists app_users_select_same_family on app_users;
drop policy if exists app_users_insert_self on app_users;
drop policy if exists app_users_update_self_or_parent on app_users;

drop policy if exists child_profiles_select_same_family on child_profiles;
drop policy if exists child_profiles_insert_parent_only on child_profiles;
drop policy if exists child_profiles_update_parent_only on child_profiles;
drop policy if exists child_profiles_delete_parent_only on child_profiles;

drop policy if exists child_account_links_select_same_family on child_account_links;
drop policy if exists child_account_links_insert_parent_only on child_account_links;
drop policy if exists child_account_links_delete_parent_only on child_account_links;

-- families
create policy families_select_member
on families
for select
to authenticated
using (
  exists (
    select 1
    from app_users au
    where au.id = auth.uid()::text
      and au.family_id = families.id
  )
);

create policy families_insert_authenticated
on families
for insert
to authenticated
with check (true);

-- app_users
create policy app_users_select_same_family
on app_users
for select
to authenticated
using (
  id = auth.uid()::text
  or (
    family_id is not null
    and exists (
      select 1
      from app_users me
      where me.id = auth.uid()::text
        and me.family_id is not null
        and me.family_id = app_users.family_id
    )
  )
);

create policy app_users_insert_self
on app_users
for insert
to authenticated
with check (id = auth.uid()::text);

create policy app_users_update_self_or_parent
on app_users
for update
to authenticated
using (
  id = auth.uid()::text
  or exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id is not null
      and me.family_id = app_users.family_id
  )
)
with check (
  id = auth.uid()::text
  or exists (
    select 1
    from app_users me
    where me.id = auth.uid()::text
      and me.role = 'parent'
      and me.family_id is not null
      and me.family_id = app_users.family_id
  )
);

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
