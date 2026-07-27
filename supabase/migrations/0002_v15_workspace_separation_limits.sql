-- V15 keeps the clean V13 schema and raises only source-count limits.
-- Safe to apply to the current test project after 0001_v13_cloud_baseline.sql.

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
