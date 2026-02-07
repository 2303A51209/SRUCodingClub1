-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends auth.users, but we create a public pointer if needed context, otherwise usually we rely on auth.users + public.profiles)
-- For this architecture, we usually sync auth.users to public.users to keep app logic clean.
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'team', 'member')) default 'member',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EVENTS TABLE
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  date timestamp with time zone not null,
  location text,
  capacity int,
  status text check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')) default 'upcoming',
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REGISTRATIONS TABLE
create table public.registrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  event_id uuid references public.events(id) not null,
  status text check (status in ('confirmed', 'waitlist', 'cancelled')) default 'confirmed',
  attended boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, event_id)
);

-- GALLERY ITEMS TABLE
create table public.gallery_items (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  caption text,
  category text,
  uploaded_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANNOUNCEMENTS TABLE
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  target_role text check (target_role in ('all', 'member', 'team', 'admin')) default 'all',
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_events_date on public.events(date);
create index idx_registrations_user on public.registrations(user_id);
create index idx_registrations_event on public.registrations(event_id);
