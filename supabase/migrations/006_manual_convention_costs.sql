begin;
alter table public.conventions add column if not exists cost_items jsonb default null;
alter table public.conventions add column if not exists cost_items_revision integer not null default 0;
alter table public.conventions add column if not exists cost_manager_id uuid references public.users(id);
create or replace function public.get_convention_cost_participants(p_convention uuid)
returns table(id uuid,name text,is_manager boolean)
language sql stable security definer set search_path=public as $$
 select distinct u.id,u.name::text,
 u.id=coalesce(c.cost_manager_id,(select o.id from public.users o where o.email='mayuanliang1104@gmail.com' limit 1),c.created_by) as is_manager
 from public.conventions c join public.users u on
 u.id=coalesce(c.cost_manager_id,(select o.id from public.users o where o.email='mayuanliang1104@gmail.com' limit 1),c.created_by)
 or exists(select 1 from public.booth_assignments b where b.convention_id=c.id and b.artist_id=u.id and b.status<>'cancelled')
 where c.id=p_convention and auth.uid() is not null
 order by is_manager desc,name,id
$$;
revoke all on function public.get_convention_cost_participants(uuid) from public,anon;
grant execute on function public.get_convention_cost_participants(uuid) to authenticated;
create or replace function public.save_convention_costs(p_convention uuid,p_expected integer,p_items jsonb)
returns setof public.conventions language plpgsql security invoker set search_path=public as $$
declare item jsonb; amount numeric; person jsonb;
begin
 if auth.uid() is null or not public.inkflow_owner() then raise insufficient_privilege using message='Manager access required'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid cost list'; end if;
 if jsonb_array_length(p_items)>200 then raise exception 'Too many cost items'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'title') is distinct from 'string' or length(trim(item->>'title')) not between 1 and 200 or jsonb_typeof(item->'amount') is distinct from 'number' then raise exception 'Invalid cost item';end if;
  amount=(item->>'amount')::numeric;
  if amount<0 or amount>1000000000 or amount<>round(amount,2) then raise exception 'Invalid cost amount';end if;
  if coalesce(item->>'split','team') not in ('team','selected') then raise exception 'Invalid cost sharing';end if;
  if item->>'split'='selected' then
   if jsonb_typeof(item->'participant_ids') is distinct from 'array' then raise exception 'Choose cost participants';end if;
   if jsonb_array_length(item->'participant_ids')=0 then raise exception 'Choose cost participants';end if;
   for person in select value from jsonb_array_elements(item->'participant_ids') loop
    if jsonb_typeof(person) is distinct from 'string' or not exists(select 1 from public.get_convention_cost_participants(p_convention) p where p.id::text=person#>>'{}') then raise exception 'Invalid cost participant';end if;
   end loop;
  end if;
 end loop;
 return query update public.conventions set cost_items=p_items,cost_manager_id=auth.uid(),cost_items_revision=cost_items_revision+1 where id=p_convention and cost_items_revision=p_expected returning *;
 if not found then raise exception 'COST_CONFLICT: reload before saving';end if;
end;$$;
revoke all on function public.save_convention_costs(uuid,integer,jsonb) from public,anon;
grant execute on function public.save_convention_costs(uuid,integer,jsonb) to authenticated;
-- Preserve the original artist signup and withdrawal flow.
drop policy if exists original_booths_self_signup on public.booth_assignments;
create policy original_booths_self_signup on public.booth_assignments for insert to authenticated
 with check(artist_id=auth.uid() and status='assigned' and exists(select 1 from public.users u where u.id=auth.uid() and u.role='artist'));
drop policy if exists original_booths_self_withdraw on public.booth_assignments;
create policy original_booths_self_withdraw on public.booth_assignments for delete to authenticated using(artist_id=auth.uid());
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='conventions') then
  alter publication supabase_realtime add table public.conventions;
 end if;
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='booth_assignments') then
  alter publication supabase_realtime add table public.booth_assignments;
 end if;
end$$;
commit;
