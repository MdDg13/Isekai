-- Setup Supabase Storage bucket for AI-generated dungeon maps

-- Create the bucket (run this in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dungeon-maps',
  'dungeon-maps',
  true, -- Public read access
  10485760, -- 10MB max file size
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for dungeon-maps bucket

-- Allow public read access to all maps
CREATE POLICY "Public read access for dungeon maps"
ON storage.objects FOR SELECT
USING (bucket_id = 'dungeon-maps');

-- Allow authenticated users to upload maps (world owners)
CREATE POLICY "Authenticated users can upload dungeon maps"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dungeon-maps' 
  AND auth.role() = 'authenticated'
);

-- Allow world owners to update/delete their maps
CREATE POLICY "World owners can update dungeon maps"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dungeon-maps'
  AND auth.role() = 'authenticated'
  -- Note: Additional check would require joining with world_element table
  -- For now, any authenticated user can update (can be refined later)
);

CREATE POLICY "World owners can delete dungeon maps"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dungeon-maps'
  AND auth.role() = 'authenticated'
);

