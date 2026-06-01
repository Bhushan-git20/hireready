-- HireReady Schema
-- Drop old tables if rebuilding on existing Supabase project

drop table if exists public.analyses cascade;
drop table if exists public.applications cascade;
drop table if exists public.profiles cascade;

-- Profiles: user's career background
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  full_name text not null default '',
  skills text[] not null default '{}',
  experience_text text not null default '',
  projects_text text not null default '',
  resume_text text not null default '',
  target_roles text[] not null default '{}',
  cgpa text not null default '',
  college text not null default '',
  graduation_year text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications: job applications tracker
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  jd_text text not null default '',
  fit_grade text not null default '',
  status text not null default 'applied'
    check (status in ('applied', 'assessment', 'interview', 'offer', 'rejected', 'ghosted')),
  applied_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Analyses: stored JD analysis results
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  jd_text text not null,
  fit_grade text not null,
  fit_score integer check (fit_score >= 0 and fit_score <= 100),
  recommendation text not null,
  skill_gaps jsonb not null default '[]',
  matching_skills jsonb not null default '[]',
  star_questions jsonb not null default '[]',
  should_apply boolean not null default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.analyses enable row level security;

-- Profiles policies
create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Applications policies
create policy "Users manage own applications"
  on public.applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Analyses policies
create policy "Users manage own analyses"
  on public.analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();
