-- AUDIT LOGS TABLE
-- Tracks critical actions for security and compliance (Repudiation protection)

create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null, -- Keep log even if user deleted
  action text not null, -- e.g., 'LOGIN', 'LOGOUT', 'CREATE_EVENT', 'DELETE_USER'
  resource text, -- e.g., 'events/123', 'users/456'
  details jsonb, -- Flexible field for extra data (diffs, error messages)
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_audit_logs_user on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_created_at on public.audit_logs(created_at);
