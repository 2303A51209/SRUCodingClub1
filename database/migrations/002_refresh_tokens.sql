-- REFRESH TOKENS TABLE (For Rotation)
-- We store the hash of the refresh token to verify it hasn't been used/revoked.
-- The actual token is sent to the client (HttpOnly).

create table public.refresh_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  token_hash text not null, -- Store SHA256 of the token
  expires_at timestamp with time zone not null,
  revoked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  replaced_by_token_hash text -- Chain of rotation, points to the new token hash if this one was rotated
);

create index idx_refresh_tokens_token_hash on public.refresh_tokens(token_hash);
create index idx_refresh_tokens_user on public.refresh_tokens(user_id);
