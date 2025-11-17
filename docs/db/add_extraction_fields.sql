-- Add new extraction fields to reference tables

-- Add to reference_item
ALTER TABLE public.reference_item 
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS estimated_real_weight_kg numeric,
ADD COLUMN IF NOT EXISTS volume_category text,
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_spell
ALTER TABLE public.reference_spell 
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_monster
ALTER TABLE public.reference_monster 
ADD COLUMN IF NOT EXISTS lair_actions jsonb,
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_class
ALTER TABLE public.reference_class 
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_race
ALTER TABLE public.reference_race 
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_feat
ALTER TABLE public.reference_feat 
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Add to reference_background
ALTER TABLE public.reference_background 
ADD COLUMN IF NOT EXISTS extraction_confidence_score int;

-- Create reference_subclass table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reference_subclass (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_class text, -- e.g., "Fighter", "Wizard", "Cleric"
  level_granted int default 2, -- level at which subclass is chosen (usually 2 or 3)
  description text,
  features jsonb, -- array of {level: 3, name: "...", description: "..."} for subclass features
  source text not null default 'Free5e',
  page_reference text,
  tags text[],
  extraction_confidence_score int, -- 0-100 quality score
  created_at timestamptz default now(),
  created_by uuid,
  constraint reference_subclass_name_unique unique (name, source)
);

