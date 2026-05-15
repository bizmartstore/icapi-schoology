
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Materials are publicly readable" ON storage.objects;
CREATE POLICY "Materials are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Teachers can upload materials" ON storage.objects;
CREATE POLICY "Teachers can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'teacher')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can update own materials" ON storage.objects;
CREATE POLICY "Teachers can update own materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can delete own materials" ON storage.objects;
CREATE POLICY "Teachers can delete own materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
