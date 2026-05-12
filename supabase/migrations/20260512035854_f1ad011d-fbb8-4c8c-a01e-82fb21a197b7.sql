-- Create submissions storage bucket (public for easy download)
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Submissions are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- Students upload to their own folder (first path segment = user id)
CREATE POLICY "Students upload own submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students update own submissions"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students delete own submissions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin manage all
CREATE POLICY "Admin manages submission files"
ON storage.objects FOR ALL
USING (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'submissions' AND public.has_role(auth.uid(), 'admin'));

-- Add attachment_url column to activities so teachers can attach a file/link
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS attachment_name TEXT;