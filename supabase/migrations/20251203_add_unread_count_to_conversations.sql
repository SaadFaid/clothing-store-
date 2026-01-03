-- FULL CLEAN BUILD
------------------------------------------------------------
-- Add unread count tracking columns for both sides
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS user_unread_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_unread_count INTEGER DEFAULT 0;


------------------------------------------------------------
-- Helper function that recalculates unread counts for a conversation
CREATE OR REPLACE FUNCTION update_conversation_unread_counts(conv_id UUID)
RETURNS VOID AS $$
BEGIN
  -- For USER inbox → unread ADMIN messages
  UPDATE conversations
  SET user_unread_count = (
    SELECT COUNT(*) FROM messages
    WHERE conversation_id = conv_id
      AND sender_role = 'admin'
      AND is_read = false
  )
  WHERE id = conv_id;

  -- For ADMIN inbox → unread USER messages
  UPDATE conversations
  SET admin_unread_count = (
    SELECT COUNT(*) FROM messages
    WHERE conversation_id = conv_id
      AND sender_role = 'user'
      AND is_read = false
  )
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


------------------------------------------------------------
-- Trigger function that fires automatically on message change
CREATE OR REPLACE FUNCTION message_unread_counts_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_conversation_unread_counts(NEW.conversation_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_conversation_unread_counts(OLD.conversation_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


------------------------------------------------------------
-- Create message trigger
DROP TRIGGER IF EXISTS message_unread_count_trigger ON messages;
CREATE TRIGGER message_unread_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION message_unread_counts_trigger_fn();


------------------------------------------------------------
-- Initialize values for existing conversations
UPDATE conversations
SET user_unread_count = (
    SELECT COUNT(*) FROM messages
    WHERE conversation_id = conversations.id
      AND sender_role = 'admin'
      AND is_read = false
  ),
  admin_unread_count = (
    SELECT COUNT(*) FROM messages
    WHERE conversation_id = conversations.id
      AND sender_role = 'user'
      AND is_read = false
  );
------------------------------------------------------------
