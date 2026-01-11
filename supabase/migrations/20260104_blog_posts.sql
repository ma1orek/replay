-- Blog Posts Table for SEO Content Engine
-- Run this in Supabase SQL Editor

-- Create blog_posts table
create table if not exists blog_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  content text, -- Markdown content
  meta_description text,
  target_keyword text,
  tone text default 'technical', -- 'technical', 'controversial', 'tutorial', 'comparison'
  key_takeaways text[], -- Array of key points to include
  status text default 'draft', -- 'draft', 'review', 'published'
  author_id uuid references auth.users(id),
  featured_image text, -- URL to featured image
  read_time_minutes integer,
  seo_score integer, -- 0-100 score
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone
);

-- Create index for faster queries
create index if not exists blog_posts_status_idx on blog_posts(status);
create index if not exists blog_posts_slug_idx on blog_posts(slug);
create index if not exists blog_posts_created_at_idx on blog_posts(created_at desc);

-- Enable Row Level Security
alter table blog_posts enable row level security;

-- Policy: Admin can do everything (we'll check admin status in the API)
create policy "Admin full access" on blog_posts
  for all
  using (true)
  with check (true);

-- Policy: Public can read published posts
create policy "Public read published" on blog_posts
  for select
  using (status = 'published');

-- Trigger to update updated_at
create or replace function update_blog_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row
  execute function update_blog_posts_updated_at();

-- Sample article categories/tags table (optional, for future use)
create table if not exists blog_categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Junction table for posts <-> categories (many-to-many)
create table if not exists blog_post_categories (
  post_id uuid references blog_posts(id) on delete cascade,
  category_id uuid references blog_categories(id) on delete cascade,
  primary key (post_id, category_id)
);

-- Insert default categories
insert into blog_categories (name, slug, description) values
  ('Comparisons', 'comparisons', 'Product comparisons and alternatives'),
  ('Tutorials', 'tutorials', 'How-to guides and walkthroughs'),
  ('Case Studies', 'case-studies', 'Real-world examples and results'),
  ('Engineering', 'engineering', 'Technical deep-dives'),
  ('Product Updates', 'product-updates', 'Replay feature announcements')
on conflict (slug) do nothing;







