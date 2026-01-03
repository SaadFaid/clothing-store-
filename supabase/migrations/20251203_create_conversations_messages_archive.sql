-- Create conversations, messages, and archive tables
-- Idempotent: uses IF NOT EXISTS and drops conflicting policies before creating

BEGIN;

-- Conversations table: represents a conversation thread started by a user
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Messages table: each message belongs to a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_name text,
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin','owner')),
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Archive table: keeps JSON snapshot of deleted records
CREATE TABLE IF NOT EXISTS public.archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  original_id uuid,
  before_data jsonb NOT NULL,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on messages/conversations/archive for safety
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.archive ENABLE ROW LEVEL SECURITY;

-- Drop any policies that may conflict (safe to run multiple times)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_policy WHERE polname = 'allow_conversation_select') THEN
    EXECUTE 'DROP POLICY IF EXISTS allow_conversation_select ON public.conversations';
  END IF;
END$$;

DROP POLICY IF EXISTS allow_conversation_select ON public.conversations;
DROP POLICY IF EXISTS allow_conversation_insert ON public.conversations;
DROP POLICY IF EXISTS allow_conversation_delete ON public.conversations;
DROP POLICY IF EXISTS allow_message_select ON public.messages;
DROP POLICY IF EXISTS allow_message_insert ON public.messages;
DROP POLICY IF EXISTS allow_message_delete ON public.messages;
DROP POLICY IF EXISTS allow_archive_admins ON public.archive;

-- Policies:
-- Conversations: users can insert their own conversations; admins/owners can select and delete any
CREATE POLICY allow_conversation_insert ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY allow_conversation_select ON public.conversations
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner'))
  );
  
CREATE POLICY allow_conversation_delete ON public.conversations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner'))
  );

-- Messages: users can insert messages into their own conversations; admins/owners can insert, select, and delete
CREATE POLICY allow_message_insert ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner')))
    )
  );

CREATE POLICY allow_message_select ON public.messages
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner')))
    )
  );

CREATE POLICY allow_message_delete ON public.messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner'))
  );

-- Archive: only admins/owners can select/insert/delete from archive
CREATE POLICY allow_archive_admins ON public.archive
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner'))
  );

COMMIT;
