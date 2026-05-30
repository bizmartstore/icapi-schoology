-- Private DMs and replies within section chat
ALTER TABLE public.section_messages
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.section_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_section_messages_private
  ON public.section_messages (section_id, recipient_id, created_at);

CREATE INDEX IF NOT EXISTS idx_section_messages_reply
  ON public.section_messages (reply_to_id);

COMMENT ON COLUMN public.section_messages.recipient_id IS
  'NULL = section group chat; set = private DM to this user (same section).';

-- Replace message policies for group + private visibility
DROP POLICY IF EXISTS "Members and adviser view section messages" ON public.section_messages;
DROP POLICY IF EXISTS "Members and adviser send messages" ON public.section_messages;

CREATE POLICY "View section group and private messages"
  ON public.section_messages FOR SELECT
  USING (
    (
      recipient_id IS NULL
      AND (
        public.is_section_member(section_id, auth.uid())
        OR public.is_section_owner(section_id, auth.uid())
      )
    )
    OR (
      recipient_id IS NOT NULL
      AND (
        auth.uid() = user_id
        OR auth.uid() = recipient_id
      )
      AND (
        public.is_section_member(section_id, auth.uid())
        OR public.is_section_owner(section_id, auth.uid())
      )
    )
  );

CREATE POLICY "Send section group and private messages"
  ON public.section_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_section_member(section_id, auth.uid())
      OR public.is_section_owner(section_id, auth.uid())
    )
    AND (
      recipient_id IS NULL
      OR (
        recipient_id IS NOT NULL
        AND recipient_id <> auth.uid()
        AND (
          public.is_section_member(section_id, recipient_id)
          OR public.is_section_owner(section_id, recipient_id)
        )
      )
    )
  );
