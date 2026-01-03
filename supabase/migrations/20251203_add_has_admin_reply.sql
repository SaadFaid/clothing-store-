-- Add has_admin_reply column to conversations to track if admin has replied
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS has_admin_reply boolean DEFAULT false;

-- Add is_initial_message column to messages to track if it's a contact form message or first user message
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_initial_message boolean DEFAULT false;

-- Add is_archived flag to conversations so we can soft-delete/archive without removing rows
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Mark first message in each conversation as initial message
UPDATE messages m
SET is_initial_message = true
WHERE id IN (
  SELECT id FROM messages
  WHERE (conversation_id, created_at) IN (
    SELECT conversation_id, MIN(created_at)
    FROM messages
    GROUP BY conversation_id
  )
  AND sender_role = 'user'
);

-- Update existing conversations that have admin/owner messages to set has_admin_reply = true
UPDATE conversations
SET has_admin_reply = true
WHERE id IN (
  SELECT DISTINCT conversation_id
  FROM messages
  WHERE sender_role IN ('admin', 'owner')
);

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS message_set_admin_reply_trigger ON messages;
DROP FUNCTION IF EXISTS set_has_admin_reply_on_message();

-- Create function to automatically set has_admin_reply when admin/owner sends a message
CREATE OR REPLACE FUNCTION set_has_admin_reply_on_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_role IN ('admin', 'owner') THEN
    UPDATE conversations
    SET has_admin_reply = true
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a message is inserted
CREATE TRIGGER message_set_admin_reply_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_has_admin_reply_on_message();

-- Add UPDATE policy for messages to allow users/admins to mark messages as read
DROP POLICY IF EXISTS allow_message_update ON messages;
CREATE POLICY allow_message_update ON messages
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner')))
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','owner')))
    )
  );
