-- Private rollback history; existing PIN-gated service-role endpoint only.
create table if not exists public.family_hub_history (
 id bigint generated always as identity primary key,
 state_id text not null,
 data jsonb not null,
 saved_at timestamptz not null,
 archived_at timestamptz not null default now()
);
alter table public.family_hub_history enable row level security;
revoke all on public.family_hub_history from anon, authenticated;
grant all on public.family_hub_history to service_role;
grant usage, select on sequence public.family_hub_history_id_seq to service_role;
create index family_hub_history_state_recent on public.family_hub_history(state_id,id desc);
insert into public.family_hub_history(state_id,data,saved_at)
select id,data,updated_at from public.family_hub_state;
create or replace function public.archive_family_hub_state()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 insert into public.family_hub_history(state_id,data,saved_at) values(old.id,old.data,old.updated_at);
 delete from public.family_hub_history where state_id=old.id and id in
 (select id from public.family_hub_history where state_id=old.id order by id desc offset 100);
 return new;
end;
$$;
revoke all on function public.archive_family_hub_state() from public, anon, authenticated;
grant execute on function public.archive_family_hub_state() to service_role;
create trigger family_hub_state_archive before update on public.family_hub_state
for each row when(old.data is distinct from new.data)
execute function public.archive_family_hub_state();
