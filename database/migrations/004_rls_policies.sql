-- ROW LEVEL SECURITY POLICIES

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.gallery_items enable row level security;
alter table public.announcements enable row level security;
alter table public.refresh_tokens enable row level security;
alter table public.audit_logs enable row level security;

-- USERS
-- Everyone can read basics
create policy "Users are viewable by everyone" on public.users
  for select using (true);

-- User can update own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- EVENTS
create policy "Events are viewable by everyone" on public.events
  for select using (true);

-- Only Team/Admin can full CRUD events
-- (Assumption: We have a function or claim to check role, for now we assume 'role' in public.users)
-- Ideally we use a custom claim or join, but basic check via subquery:
create policy "Team can manage events" on public.events
  for all using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'team')
    )
  );

-- REGISTRATIONS
-- Users can see their own registrations
create policy "Users can see own registrations" on public.registrations
  for select using (auth.uid() = user_id);

-- Team/Admin can see all
create policy "Team can see all registrations" on public.registrations
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'team')
    )
  );

-- Users can register themselves
create policy "Users can register themselves" on public.registrations
  for insert with check (auth.uid() = user_id);

-- REFRESH TOKENS
-- Only accessible by server service role usually, but if client reads:
create policy "Users can read own refresh tokens" on public.refresh_tokens
  for select using (auth.uid() = user_id);

-- AUDIT LOGS
-- Only Admin can read
create policy "Admins View Audit Logs" on public.audit_logs
  for select using (
     exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
