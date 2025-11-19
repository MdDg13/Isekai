-- Setup Supabase Storage Bucket for NPC Assets
-- Run this in Supabase SQL Editor to create the storage bucket for NPC portraits

-- Create the storage bucket (if it doesn't exist)
-- Note: This requires admin access. If you get permission errors, create the bucket manually in the Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "npc-assets"
-- 4. Public: true (so images can be accessed via public URLs)
-- 5. File size limit: 10MB (or as needed)
-- 6. Allowed MIME types: image/png, image/jpeg, image/webp

-- If you have admin access, you can create it via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'npc-assets',
  'npc-assets',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public read access
-- Allow anyone to read files from the bucket
CREATE POLICY IF NOT EXISTS "Public read access for npc-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'npc-assets');

-- Allow authenticated users to upload/update files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to npc-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'npc-assets' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can update npc-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'npc-assets' AND
  auth.role() = 'authenticated'
);

-- Allow service role to upload (for server-side functions)
CREATE POLICY IF NOT EXISTS "Service role can manage npc-assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'npc-assets' AND
  auth.role() = 'service_role'
);

