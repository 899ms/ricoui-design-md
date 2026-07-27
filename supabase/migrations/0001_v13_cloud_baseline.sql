-- V13 public-Beta cloud baseline.
-- The project had no production users when this migration replaced V9.

create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Workspace' check (octet_length(name) <= 160),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.documents (
  id text not null check (octet_length(id) between 1 and 160),
  workspace_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (octet_length(name) between 1 and 240),
  raw_markdown text not null check (octet_length(raw_markdown) <= 256000),
  tags jsonb not null default '[]'::jsonb,
  category text check (category is null or octet_length(category) <= 120),
  pinned boolean not null default false,
  origin jsonb not null default '{}'::jsonb,
  last_opened_at bigint,
  notes text check (notes is null or octet_length(notes) <= 4096),
  version integer not null default 1 check (version > 0),
  created_at bigint not null,
  updated_at bigint not null,
  synced_at timestamptz not null default now(),
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade,
  primary key (owner_id, id),
  check (jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 50 and octet_length(tags::text) <= 8192),
  check (jsonb_typeof(origin) = 'object' and octet_length(origin::text) <= 8192)
);

create table public.library_entries (
  id text not null check (octet_length(id) between 1 and 160),
  workspace_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (octet_length(name) between 1 and 240),
  description text not null default '' check (octet_length(description) <= 4096),
  tags jsonb not null default '[]'::jsonb,
  category text check (category is null or octet_length(category) <= 120),
  md_content text not null check (octet_length(md_content) <= 256000),
  version integer not null default 1 check (version > 0),
  created_at bigint not null,
  updated_at bigint not null,
  synced_at timestamptz not null default now(),
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade,
  primary key (owner_id, id),
  check (jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 50 and octet_length(tags::text) <= 8192)
);

create table public.workspace_preferences (
  workspace_id uuid primary key,
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  active_document_id text check (active_document_id is null or octet_length(active_document_id) <= 160),
  active_view text not null default 'structured' check (active_view in ('structured', 'source', 'preview')),
  brand_favorites jsonb not null default '[]'::jsonb,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade,
  check (jsonb_typeof(brand_favorites) = 'array' and jsonb_array_length(brand_favorites) <= 200 and octet_length(brand_favorites::text) <= 16384)
);

create table public.sync_tombstones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('document', 'library_entry')),
  entity_id text not null check (octet_length(entity_id) between 1 and 160),
  deleted_at bigint not null,
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade,
  unique (workspace_id, entity_type, entity_id)
);

create table public.cloud_controls (
  singleton boolean primary key default true check (singleton),
  registration_enabled boolean not null default true,
  sync_growth_enabled boolean not null default true,
  releases_enabled boolean not null default true,
  message text check (message is null or octet_length(message) <= 500),
  updated_at timestamptz not null default now()
);
insert into public.cloud_controls (singleton) values (true);

create table public.account_usage (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  document_count integer not null default 0,
  library_count integer not null default 0,
  markdown_bytes bigint not null default 0,
  release_count integer not null default 0,
  release_bytes bigint not null default 0,
  publish_window_started_at timestamptz,
  publish_attempts integer not null default 0,
  download_window_started_at timestamptz,
  download_attempts integer not null default 0,
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade
);

create table public.document_releases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null check (source_kind in ('document', 'library_entry')),
  source_id text not null check (octet_length(source_id) between 1 and 160),
  source_name text not null check (octet_length(source_name) between 1 and 240),
  source_version integer not null check (source_version > 0),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  exporter_version text not null check (octet_length(exporter_version) between 1 and 40),
  object_path text not null unique check (octet_length(object_path) <= 500),
  zip_sha256 text check (zip_sha256 is null or zip_sha256 ~ '^[0-9a-f]{64}$'),
  stored_bytes bigint not null check (stored_bytes between 0 and 2097152),
  uncompressed_bytes bigint not null check (uncompressed_bytes between 0 and 4194304),
  manifest jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'complete', 'deleting')),
  client_request_id uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  foreign key (workspace_id, owner_id)
    references public.workspaces(id, owner_id) on delete cascade,
  unique (owner_id, client_request_id),
  check (jsonb_typeof(manifest) = 'array' and jsonb_array_length(manifest) <= 12 and octet_length(manifest::text) <= 16384)
);

create index document_releases_owner_created_idx
  on public.document_releases(owner_id, created_at desc);
create index document_releases_source_idx
  on public.document_releases(owner_id, source_kind, source_id, created_at desc);
create index document_releases_pending_idx
  on public.document_releases(status, expires_at) where status = 'pending';

create or replace function public.epoch_ms()
returns bigint language sql stable as $$
  select floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
$$;

create or replace function public.lock_owner(p_owner uuid)
returns void language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 13));
end;
$$;

create or replace function public.enforce_source_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_docs integer;
  v_library integer;
  v_bytes bigint;
  v_growth_enabled boolean;
  v_old_bytes bigint := 0;
  v_new_bytes bigint := 0;
begin
  perform public.lock_owner(new.owner_id);
  select sync_growth_enabled into v_growth_enabled from public.cloud_controls where singleton;
  if tg_table_name = 'documents' then
    v_new_bytes := octet_length(new.raw_markdown);
    if tg_op = 'UPDATE' then v_old_bytes := octet_length(old.raw_markdown); end if;
  else
    v_new_bytes := octet_length(new.md_content);
    if tg_op = 'UPDATE' then v_old_bytes := octet_length(old.md_content); end if;
  end if;
  if not v_growth_enabled and (tg_op = 'INSERT' or v_new_bytes > v_old_bytes) then
    raise exception using errcode = 'P0001', message = 'RICO_CLOUD_GROWTH_FROZEN';
  end if;
  select count(*), coalesce(sum(octet_length(raw_markdown)), 0)
    into v_docs, v_bytes from public.documents
    where owner_id = new.owner_id and (tg_table_name <> 'documents' or id <> new.id);
  select count(*), v_bytes + coalesce(sum(octet_length(md_content)), 0)
    into v_library, v_bytes from public.library_entries
    where owner_id = new.owner_id and (tg_table_name <> 'library_entries' or id <> new.id);
  if tg_table_name = 'documents' then v_docs := v_docs + 1; else v_library := v_library + 1; end if;
  v_bytes := v_bytes + v_new_bytes;
  if v_docs > 75 then raise exception using errcode = 'P0001', message = 'RICO_QUOTA_DOCUMENTS'; end if;
  if v_library > 50 then raise exception using errcode = 'P0001', message = 'RICO_QUOTA_LIBRARY'; end if;
  if v_bytes > 1048576 then raise exception using errcode = 'P0001', message = 'RICO_QUOTA_MARKDOWN_BYTES'; end if;
  return new;
end;
$$;

create or replace function public.enforce_tombstone_limits()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.lock_owner(new.owner_id);
  if (select count(*) from public.sync_tombstones where owner_id = new.owner_id and id <> new.id) >= 200 then
    delete from public.sync_tombstones where id in (
      select id from public.sync_tombstones where owner_id = new.owner_id
      order by deleted_at asc limit 25
    );
  end if;
  return new;
end;
$$;

create or replace function public.bump_record_version()
returns trigger language plpgsql as $$
begin
  new.version := old.version + 1;
  new.updated_at := public.epoch_ms();
  new.synced_at := now();
  return new;
end;
$$;

create or replace function public.bump_workspace_version()
returns trigger language plpgsql as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.recompute_account_usage()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid := coalesce(new.owner_id, old.owner_id);
  v_workspace uuid;
begin
  select id into v_workspace from public.workspaces where owner_id = v_owner;
  if v_workspace is null then return coalesce(new, old); end if;
  insert into public.account_usage (
    owner_id, workspace_id, document_count, library_count, markdown_bytes,
    release_count, release_bytes, updated_at
  ) values (
    v_owner, v_workspace,
    (select count(*) from public.documents where owner_id = v_owner),
    (select count(*) from public.library_entries where owner_id = v_owner),
    (select coalesce(sum(octet_length(raw_markdown)), 0) from public.documents where owner_id = v_owner) +
      (select coalesce(sum(octet_length(md_content)), 0) from public.library_entries where owner_id = v_owner),
    (select count(*) from public.document_releases where owner_id = v_owner and status in ('pending', 'complete', 'deleting')),
    (select coalesce(sum(stored_bytes), 0) from public.document_releases where owner_id = v_owner and status in ('pending', 'complete', 'deleting')),
    now()
  ) on conflict (owner_id) do update set
    document_count = excluded.document_count,
    library_count = excluded.library_count,
    markdown_bytes = excluded.markdown_bytes,
    release_count = excluded.release_count,
    release_bytes = excluded.release_bytes,
    updated_at = now();
  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_release_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_enabled boolean;
  v_count integer;
  v_bytes bigint;
  v_source_count integer;
  v_oldest_bytes bigint := 0;
  v_usage public.account_usage%rowtype;
begin
  perform public.lock_owner(new.owner_id);
  select releases_enabled into v_enabled from public.cloud_controls where singleton;
  if not v_enabled then
    raise exception using errcode = 'P0001', message = 'RICO_RELEASES_FROZEN';
  end if;
  insert into public.account_usage(owner_id, workspace_id)
    values (new.owner_id, new.workspace_id) on conflict (owner_id) do nothing;
  select * into v_usage from public.account_usage where owner_id = new.owner_id for update;
  if v_usage.publish_window_started_at is null or v_usage.publish_window_started_at < now() - interval '1 hour' then
    update public.account_usage set publish_window_started_at = now(), publish_attempts = 1
      where owner_id = new.owner_id;
  elsif v_usage.publish_attempts >= 10 then
    raise exception using errcode = 'P0001', message = 'RICO_RATE_PUBLISH';
  else
    update public.account_usage set publish_attempts = publish_attempts + 1
      where owner_id = new.owner_id;
  end if;
  select count(*), coalesce(sum(stored_bytes), 0) into v_count, v_bytes
    from public.document_releases
    where owner_id = new.owner_id and status in ('pending', 'complete', 'deleting');
  select count(*) into v_source_count from public.document_releases
    where owner_id = new.owner_id and source_kind = new.source_kind
      and source_id = new.source_id and status = 'complete';
  if exists (
    select 1 from public.document_releases
    where owner_id = new.owner_id and source_kind = new.source_kind
      and source_id = new.source_id and status = 'pending'
  ) then
    raise exception using errcode = 'P0001', message = 'RICO_RELEASE_IN_PROGRESS';
  end if;
  if v_source_count >= 2 then
    select stored_bytes into v_oldest_bytes from public.document_releases
      where owner_id = new.owner_id and source_kind = new.source_kind
        and source_id = new.source_id and status = 'complete'
      order by created_at asc limit 1;
    v_count := v_count - 1;
    v_bytes := v_bytes - coalesce(v_oldest_bytes, 0);
  end if;
  if v_count + 1 > 100 then raise exception using errcode = 'P0001', message = 'RICO_QUOTA_RELEASE_COUNT'; end if;
  if v_bytes + new.stored_bytes > 5242880 then raise exception using errcode = 'P0001', message = 'RICO_QUOTA_RELEASE_BYTES'; end if;
  return new;
end;
$$;

create or replace function public.consume_download_quota(p_owner_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_usage public.account_usage%rowtype;
begin
  if p_owner_id <> auth.uid() and auth.role() <> 'service_role' then raise exception 'forbidden'; end if;
  perform public.lock_owner(p_owner_id);
  select * into v_usage from public.account_usage where owner_id = p_owner_id for update;
  if v_usage.download_window_started_at is null or v_usage.download_window_started_at < now() - interval '1 hour' then
    update public.account_usage set download_window_started_at = now(), download_attempts = 1 where owner_id = p_owner_id;
  elsif v_usage.download_attempts >= 30 then
    raise exception using errcode = 'P0001', message = 'RICO_RATE_DOWNLOAD';
  else
    update public.account_usage set download_attempts = download_attempts + 1 where owner_id = p_owner_id;
  end if;
end;
$$;

create trigger documents_enforce_limits before insert or update on public.documents
for each row execute function public.enforce_source_limits();
create trigger library_enforce_limits before insert or update on public.library_entries
for each row execute function public.enforce_source_limits();
create trigger documents_bump_version before update on public.documents
for each row execute function public.bump_record_version();
create trigger library_bump_version before update on public.library_entries
for each row execute function public.bump_record_version();
create trigger workspaces_bump_version before update on public.workspaces
for each row execute function public.bump_workspace_version();
create trigger preferences_bump_version before update on public.workspace_preferences
for each row execute function public.bump_workspace_version();
create trigger documents_usage after insert or update or delete on public.documents
for each row execute function public.recompute_account_usage();
create trigger library_usage after insert or update or delete on public.library_entries
for each row execute function public.recompute_account_usage();
create trigger releases_usage after insert or update or delete on public.document_releases
for each row execute function public.recompute_account_usage();
create trigger releases_enforce_limits before insert on public.document_releases
for each row execute function public.enforce_release_limits();
create trigger tombstones_enforce_limits before insert or update on public.sync_tombstones
for each row execute function public.enforce_tombstone_limits();

alter table public.workspaces enable row level security;
alter table public.documents enable row level security;
alter table public.library_entries enable row level security;
alter table public.workspace_preferences enable row level security;
alter table public.sync_tombstones enable row level security;
alter table public.account_usage enable row level security;
alter table public.document_releases enable row level security;
alter table public.cloud_controls enable row level security;

create policy workspace_owner on public.workspaces for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy document_owner on public.documents for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy library_owner on public.library_entries for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy preference_owner on public.workspace_preferences for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy tombstone_owner on public.sync_tombstones for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy usage_owner_read on public.account_usage for select to authenticated
  using (owner_id = auth.uid());
create policy release_owner_read on public.document_releases for select to authenticated
  using (owner_id = auth.uid());
create policy controls_public_read on public.cloud_controls for select to anon, authenticated using (true);

revoke insert, update, delete on public.account_usage from anon, authenticated;
revoke insert, update, delete on public.document_releases from anon, authenticated;
revoke insert, update, delete on public.cloud_controls from anon, authenticated;
grant select on public.account_usage, public.document_releases to authenticated;
grant select on public.cloud_controls to anon, authenticated;
revoke all on function public.consume_download_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_download_quota(uuid) to service_role;

-- Create this private Bucket once per project. Server routes are the only object writers.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-releases', 'design-releases', false, 2097152, array['application/zip'])
on conflict (id) do update set public = false, file_size_limit = 2097152,
  allowed_mime_types = array['application/zip'];

-- No storage.objects policies are created: browser roles have no direct object
-- access. Server routes use the secret client after checking release ownership.
