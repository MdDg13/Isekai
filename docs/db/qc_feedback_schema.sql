-- QC Feedback Schema
-- Stores user feedback and corrections for extracted reference data

-- Feedback table for content corrections
create table if not exists public.qc_feedback (
  id uuid primary key default gen_random_uuid(),
  item_id uuid, -- Reference to the item (spell, monster, item, etc.)
  item_type text not null, -- 'spell', 'monster', 'item', 'feat', 'class', 'subclass', 'race'
  item_name text not null, -- Name of the item for quick reference
  item_source text, -- Source of the original item
  
  -- Feedback details
  issue_type text not null, -- 'missing_data', 'incorrect_data', 'false_positive', 'formatting', 'other'
  description text not null, -- Description of the issue
  expected_value text, -- What the correct value should be
  actual_value text, -- What was actually extracted
  suggested_fix text, -- Suggested fix or improvement
  
  -- User information
  submitted_by uuid references auth.users(id), -- User who submitted (null for anonymous)
  submitted_by_email text, -- Email if not logged in
  is_anonymous boolean default false,
  
  -- Status and resolution
  status text default 'pending', -- 'pending', 'reviewed', 'fixed', 'rejected', 'duplicate'
  reviewed_by uuid references auth.users(id), -- Admin who reviewed
  reviewed_at timestamptz,
  review_notes text, -- Admin notes on the feedback
  resolution text, -- How it was resolved
  
  -- Metadata
  source_file text, -- Original source file/page reference
  confidence_score int, -- Original extraction confidence score
  tags text[], -- Tags for categorization
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for efficient querying
create index if not exists idx_qc_feedback_item_type on public.qc_feedback(item_type);
create index if not exists idx_qc_feedback_status on public.qc_feedback(status);
create index if not exists idx_qc_feedback_submitted_by on public.qc_feedback(submitted_by);
create index if not exists idx_qc_feedback_created_at on public.qc_feedback(created_at desc);
create index if not exists idx_qc_feedback_item_id_type on public.qc_feedback(item_id, item_type);

-- RLS Policies
alter table public.qc_feedback enable row level security;

-- Anyone can submit feedback
create policy "Anyone can submit feedback"
  on public.qc_feedback
  for insert
  to authenticated, anon
  with check (true);

-- Users can view their own feedback
create policy "Users can view their own feedback"
  on public.qc_feedback
  for select
  to authenticated
  using (auth.uid() = submitted_by);

-- Helper function: Check if user is a DM (equivalent to admin for content review)
create or replace function public.is_dm_anywhere(u_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.campaign_member m
    where m.user_id = u_id and m.role = 'dm'
  );
$$;

-- DMs (admins) can view all feedback
create policy "DMs can view all feedback"
  on public.qc_feedback
  for select
  to authenticated
  using (public.is_dm_anywhere(auth.uid()));

-- DMs (admins) can update feedback status
create policy "DMs can update feedback"
  on public.qc_feedback
  for update
  to authenticated
  using (public.is_dm_anywhere(auth.uid()));

-- Function to update updated_at timestamp
create or replace function update_qc_feedback_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_qc_feedback_updated_at
  before update on public.qc_feedback
  for each row
  execute function update_qc_feedback_updated_at();

-- View for admin dashboard
create or replace view public.qc_feedback_summary as
select 
  item_type,
  issue_type,
  status,
  count(*) as count,
  count(*) filter (where created_at > now() - interval '7 days') as count_last_7_days,
  count(*) filter (where created_at > now() - interval '30 days') as count_last_30_days
from public.qc_feedback
group by item_type, issue_type, status;

