create table if not exists bob_cache (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references profiles(id) on delete cascade,
  question_key text not null,
  answer text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  unique(coach_id, question_key)
);

alter table bob_cache enable row level security;

create policy "Coaches can read own cache" on bob_cache
  for select using (auth.uid() = coach_id);

create policy "Service role full access" on bob_cache
  for all using (true) with check (true);
