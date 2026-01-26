-- Create storage bucket for videos with 50MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB limit (50 * 1024 * 1024)
  ARRAY['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

-- Allow anyone to read videos (public bucket)
DROP POLICY IF EXISTS "Public read access for videos" ON storage.objects;
CREATE POLICY "Public read access for videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Allow anyone to upload videos (for anonymous users)
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- Allow anyone to delete videos
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;
CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');
