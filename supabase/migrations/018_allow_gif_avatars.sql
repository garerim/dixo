-- =============================================================================
-- MIGRATION — Allow GIF avatars for Premium users
-- =============================================================================
-- Updates the avatars storage bucket to accept image/gif and increases
-- the file size limit to 10 MB (GIFs are larger than static images).
-- The API route already checks that only Premium users can upload GIFs.
-- =============================================================================

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  file_size_limit = 10485760  -- 10 MB in bytes
WHERE id = 'avatars';
