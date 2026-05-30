-- Profile avatars stored as compressed base64 data URLs (no storage bucket quota).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_data text;

COMMENT ON COLUMN public.profiles.avatar_data IS
  'Small JPEG data URL (~96px) embedded in DB to avoid storage bucket usage.';

-- Denormalized sender name on chat messages (avoids extra profile fetch per message).
ALTER TABLE public.section_messages
  ADD COLUMN IF NOT EXISTS sender_name text;

COMMENT ON COLUMN public.section_messages.sender_name IS
  'Display name captured at send time.';
