-- Optional hero image for announcements (stored as Supabase public URL, not base64)
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Unified public bucket for section covers, announcement images, activity attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Media files are publicly readable" ON storage.objects;
CREATE POLICY "Media files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[2]
);

DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
