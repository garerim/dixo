-- =============================================================================
-- MIGRATION — Setup avatars storage bucket and policies
-- =============================================================================
-- Creates storage bucket "avatars" and RLS policies for avatar uploads.
-- Note: The bucket must be created manually in Supabase Dashboard first.
-- =============================================================================

-- Create storage bucket (if it doesn't exist)
-- Note: This requires the storage extension to be enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Policy: Allow authenticated users to upload avatars
-- Files are named with user ID prefix, so users can only upload files that start with their ID
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '-%'
);

-- Policy: Allow authenticated users to delete their own avatars
-- Users can only delete files that start with their user ID
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '-%'
);

-- Policy: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
