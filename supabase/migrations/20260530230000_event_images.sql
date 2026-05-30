-- Multiple compressed images per event (carousel per event)
CREATE TABLE public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_images_event_id_idx ON public.event_images(event_id);

-- Migrate legacy single image_data on events
INSERT INTO public.event_images (event_id, image_data, sort_order)
SELECT id, image_data, 0
FROM public.events
WHERE image_data IS NOT NULL AND trim(image_data) <> '';

ALTER TABLE public.events DROP COLUMN IF EXISTS image_data;

ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images of active events"
  ON public.event_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id AND e.is_active = true
    )
  );

CREATE POLICY "Admins can view all event images"
  ON public.event_images FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert event images"
  ON public.event_images FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event images"
  ON public.event_images FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event images"
  ON public.event_images FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_images;
