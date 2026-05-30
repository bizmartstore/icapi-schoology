-- Section cover as compressed data URL in DB (no storage bucket quota)
ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS cover_image_data text;

COMMENT ON COLUMN public.sections.cover_image_data IS
  'JPEG data URL for section cover; preferred over cover_image_url when set.';
