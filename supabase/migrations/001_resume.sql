-- Run once in the Supabase SQL editor. Then set the owner UUID below.
create table public.resume_owners (user_id uuid primary key references auth.users(id));
alter table public.resume_owners enable row level security;
create policy owner_reads_self on public.resume_owners for select to authenticated using (user_id = auth.uid());
-- insert into public.resume_owners(user_id) values ('YOUR_AUTH_USER_UUID');

create table public.resumes (
 id uuid primary key, owner_id uuid not null references auth.users(id),
 slug text not null unique, draft jsonb not null, version integer not null default 0,
 updated_at timestamptz not null default now()
);
create table public.published_resumes (
 id uuid primary key references public.resumes(id) on delete cascade,
 slug text not null unique, data jsonb not null, published_at timestamptz not null default now()
);
create table public.resume_versions (
 id uuid primary key default gen_random_uuid(), resume_id uuid not null references public.resumes(id) on delete cascade,
 owner_id uuid not null references auth.users(id), data jsonb not null, reason text not null,
 created_at timestamptz not null default now()
);
create index resume_versions_lookup on public.resume_versions(resume_id, created_at desc);
alter table public.resumes enable row level security;
alter table public.published_resumes enable row level security;
alter table public.resume_versions enable row level security;
create policy owner_reads_draft on public.resumes for select to authenticated using(owner_id=auth.uid());
create policy public_reads_published on public.published_resumes for select using(true);
create policy owner_reads_versions on public.resume_versions for select to authenticated using(owner_id=auth.uid());
-- Mutations are only through transactional, owner-checked functions. No direct table writes.
create or replace function public.save_resume_draft(payload jsonb, expected_version integer, save_reason text default 'manual')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.resumes; next_data jsonb; next_version integer;
begin
 if not exists(select 1 from public.resume_owners where user_id=auth.uid()) then raise exception 'unauthorized'; end if;
 if jsonb_typeof(payload) <> 'object' or jsonb_typeof(payload->'profile') <> 'object' or payload->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid payload'; end if;
 perform pg_advisory_xact_lock(hashtextextended(payload->>'id',0));
 select * into existing from public.resumes where id=(payload->>'id')::uuid for update;
 if found then
  if existing.owner_id<>auth.uid() then raise exception 'unauthorized'; end if;
  if existing.version<>expected_version then raise exception 'version conflict'; end if;
  if existing.slug<>payload->>'slug' then raise exception 'immutable slug'; end if;
  insert into public.resume_versions(resume_id,owner_id,data,reason) values(existing.id,auth.uid(),existing.draft,left(save_reason,80));
 else
  if expected_version<>0 then raise exception 'version conflict'; end if;
 end if;
 next_version:=coalesce(existing.version,0)+1;
 next_data:=jsonb_set(jsonb_set(payload,'{metadata,version}',to_jsonb(next_version)),'{metadata,updatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
 if existing.id is not null then next_data:=jsonb_set(next_data,'{metadata,createdAt}',existing.draft#>'{metadata,createdAt}'); end if;
 insert into public.resumes(id,owner_id,slug,draft,version) values((payload->>'id')::uuid,auth.uid(),payload->>'slug',next_data,next_version)
 on conflict(id) do update set draft=excluded.draft,version=excluded.version,updated_at=now();
 return next_data;
end $$;
create or replace function public.publish_resume(resume_id uuid, expected_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item public.resumes;
begin
 if not exists(select 1 from public.resume_owners where user_id=auth.uid()) then raise exception 'unauthorized'; end if;
 select * into item from public.resumes where id=resume_id and owner_id=auth.uid() for update;
 if not found then raise exception 'not found'; end if;
 if item.version<>expected_version then raise exception 'version conflict'; end if;
 insert into public.resume_versions(resume_id,owner_id,data,reason) values(item.id,auth.uid(),item.draft,'publish');
 insert into public.published_resumes(id,slug,data) values(item.id,item.slug,item.draft)
 on conflict(id) do update set data=excluded.data,slug=excluded.slug,published_at=now();
 return item.draft;
end $$;
revoke all on function public.save_resume_draft(jsonb,integer,text) from public,anon;
revoke all on function public.publish_resume(uuid,integer) from public,anon;
grant execute on function public.save_resume_draft(jsonb,integer,text) to authenticated;
grant execute on function public.publish_resume(uuid,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('resume-sources','resume-sources',false,3145728,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/json']);
create policy owner_uploads_sources on storage.objects for insert to authenticated with check(bucket_id='resume-sources' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.resume_owners where user_id=auth.uid()));
create policy owner_reads_sources on storage.objects for select to authenticated using(bucket_id='resume-sources' and (storage.foldername(name))[1]=auth.uid()::text);
create policy owner_deletes_sources on storage.objects for delete to authenticated using(bucket_id='resume-sources' and (storage.foldername(name))[1]=auth.uid()::text);
