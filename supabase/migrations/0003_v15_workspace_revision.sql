-- V15 cache-first resume needs one lightweight revision for every editable
-- child table. The existing workspaces.version remains the canonical token.

create or replace function public.bump_parent_workspace_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if tg_op = 'DELETE' then
    v_workspace_id := old.workspace_id;
  else
    v_workspace_id := new.workspace_id;
  end if;

  -- workspaces_bump_version performs the monotonic increment. Multiple child
  -- rows may therefore advance the token more than once per logical action;
  -- clients only compare equality and never assume a precise delta.
  update public.workspaces
  set updated_at = now()
  where id = v_workspace_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger documents_bump_workspace_version
after insert or update or delete on public.documents
for each row execute function public.bump_parent_workspace_version();

create trigger library_bump_workspace_version
after insert or update or delete on public.library_entries
for each row execute function public.bump_parent_workspace_version();

create trigger preferences_bump_workspace_version
after insert or update or delete on public.workspace_preferences
for each row execute function public.bump_parent_workspace_version();

create trigger tombstones_bump_workspace_version
after insert or update or delete on public.sync_tombstones
for each row execute function public.bump_parent_workspace_version();

revoke all on function public.bump_parent_workspace_version() from public;

create or replace function public.workspace_revision_ready()
returns boolean
language sql
stable
set search_path = public
as $$
  select true;
$$;

revoke all on function public.workspace_revision_ready() from public, anon;
grant execute on function public.workspace_revision_ready() to authenticated;
