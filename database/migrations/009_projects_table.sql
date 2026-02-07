-- Migration 009: Create Projects Table

CREATE TABLE public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  tags text[] DEFAULT '{}',
  demo_url text,
  github_url text,
  status text CHECK (status IN ('active', 'completed', 'archived', 'upcoming')) DEFAULT 'active',
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster filtering
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_featured ON public.projects(is_featured);
