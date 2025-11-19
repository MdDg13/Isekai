-- Add 'dungeon' to world_element_type enum
-- Run this in Supabase SQL Editor

ALTER TYPE world_element_type ADD VALUE IF NOT EXISTS 'dungeon';

