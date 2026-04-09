-- Coach vacation mode: date ranges where a coach blocks all availability
create table if not exists public.coach_vacations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  label text,
  created_at timestamptz default now(),
  constraint valid_date_range check (end_date >= start_date)
);

create index idx_coach_vacations_coach_id on public.coach_vacations(coach_id);
create index idx_coach_vacations_dates on public.coach_vacations(start_date, end_date);

alter table public.coach_vacations enable row level security;

-- Anyone can see vacations (needed for booking UI to know coach is away)
create policy "Public read coach_vacations"
  on public.coach_vacations for select using (true);

-- Coaches can manage their own vacations
create policy "Coaches manage own vacations"
  on public.coach_vacations for all
  using (
    coach_id in (
      select id from public.coach_profiles where user_id = auth.uid()
    )
  )
  with check (
    coach_id in (
      select id from public.coach_profiles where user_id = auth.uid()
    )
  );
