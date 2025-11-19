-- Add 'dungeon' to world_element_type enum
-- Run this in Supabase SQL Editor
-- 
-- This allows dungeons to be stored in the world_element table
-- alongside NPCs, locations, factions, etc.
--
-- Dungeons can be:
-- 1. Standalone POIs on the 2D world map (with entrance_coordinates)
-- 2. Nested inside towns (parent_location_id = town location)
-- 3. Nested inside other dungeons (parent_location_id = parent dungeon)
--
-- See docs/DUNGEON_WORLD_INTEGRATION.md for architecture details

ALTER TYPE world_element_type ADD VALUE IF NOT EXISTS 'dungeon';

