# Messaging & Archive System - Implementation Guide

## Overview
This document summarizes the newly implemented conversation-based messaging system, read/unread logic, and comprehensive archive system for deleted items (users, products, conversations).

## Database Changes

### Migration File
**Location:** `supabase/migrations/20251203_create_conversations_messages_archive.sql`

**New Tables:**
1. **conversations** - represents a conversation thread started by a user
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to profiles)
   - `subject` (text, nullable)
   - `created_at` (timestamptz)

2. **messages** - individual messages within a conversation
   - `id` (uuid, primary key)
   - `conversation_id` (uuid, foreign key to conversations, cascading delete)
   - `sender_name` (text, nullable)
   - `sender_role` ('user' | 'admin' | 'owner')
   - `body` (text)
   - `is_read` (boolean, default: false)
   - `created_at` (timestamptz)

3. **archive** - JSON snapshots of deleted records
   - `id` (uuid, primary key)
   - `type` (text) - 'profile', 'product', 'conversation', etc.
   - `original_id` (uuid, nullable)
   - `before_data` (jsonb) - full record snapshot
   - `deleted_by` (uuid, nullable)
   - `deleted_at` (timestamptz)

**RLS Policies:**
- **conversations**: Users can insert/read their own; admins/owners can read any
- **messages**: Only those with access to the conversation can read/insert
- **archive**: Only admins/owners can view and manage

## Frontend Changes

### 1. Contact Form → Conversation Creation
**File:** `src/pages/ContactUsPage.tsx`
- Creates a new `conversations` record with the user ID
- Inserts the first `messages` record with `sender_role: 'user'`
- Surfaces database errors to help diagnose issues

### 2. User Mailbox (Conversation View)
**File:** `src/pages/MailboxPage.tsx`
- Displays a 3-column layout: conversation list (left), thread view (right)
- Shows header: "User Name — Date"
- Lists all messages in chronological order with timestamps
- Each reply shows its timestamp at the bottom-right
- When a user opens a conversation, all admin/owner messages are marked read
- Unread count badge per conversation
- Reply form inserts new messages with `sender_role: 'user'`

### 3. Admin Messages Page
**File:** `src/pages/admin/AdminMessages.tsx`
- Displays all user conversations in a list
- Opens conversation thread details on selection
- When admin opens a conversation, all user messages are marked read
- Unread count shown per conversation (count of unread user messages)
- Reply form inserts messages with `sender_role: 'admin'` or 'owner'
- Archive button: archives the entire conversation (stores JSON snapshot in archive table)
- "View Details" link on each message to open a detailed modal

### 4. Navbar Unread Badge
**File:** `src/components/Navbar.tsx`
- **For Users:** Shows count of unread messages from admin/owner
- **For Admins/Owners:** Shows count of unread messages from users
- Updates in real-time via Supabase `postgres_changes` subscription on `messages` table
- Badge appears next to the mailbox icon

### 5. Details Modal
**File:** `src/components/DetailsModal.tsx`
- Generic reusable modal for viewing full data of products, messages, orders, users
- Displays JSON representation of the item
- For messages: shows sender name, subject, body
- For products: shows price, stock, tax, shipping cost as formatted cards
- Optional "Restore" button (if item is archived)
- Optional "Permanently Delete" button (for archived items)
- Close button to dismiss

### 6. Archive Management Page
**File:** `src/pages/admin/AdminArchive.tsx`
- Lists all archived items (profiles, products, conversations)
- Shows `type` and `original_id`
- Displays full JSON snapshot of `before_data`
- "Restore" button: re-inserts the archived record into its original table
- "Delete Permanently" button: removes from archive

### 7. Delete Operations → Archive
**Files Modified:**
- `src/pages/admin/AdminUsers.tsx`: `handleDeleteUser` now archives user to `archive` table
- `src/pages/admin/AdminProducts.tsx`: `handleDelete` now archives product to `archive` table
- When archiving, the old `contact_messages.archived` and `contact_messages.replied` columns are no longer used (new `conversations` + `messages` tables instead)

## User Flow: Complete Example

### User submits contact form
1. User fills out "Contact Us" form with name, email, subject, message
2. Form submits → creates `conversations` row (with `user_id`, `subject`)
3. Creates first `messages` row (with `sender_name`, `body`, `sender_role: 'user'`, `is_read: false`)
4. Success message shown to user

### User checks mailbox
1. User navigates to "Mailbox" page
2. Mailbox fetches their `conversations` with nested `messages`
3. Left sidebar shows conversation list (unread count badge)
4. User clicks a conversation → marks all admin/owner messages as read
5. Conversation view shows threaded messages chronologically
6. User can reply (inserts `messages` row with `sender_role: 'user'`)

### Admin reviews inbox
1. Admin navigates to "Messages" page
2. Page lists all `conversations` with preview of latest message
3. Admin clicks a conversation → marks all user messages as read
4. Conversation view shows threaded messages
5. Admin can reply (inserts `messages` row with `sender_role: 'admin'`)
6. Admin can "View Details" on any message (opens modal with full data)
7. Admin can "Archive" the conversation (stores JSON snapshot in `archive` table, deletes conversation + cascading messages)

### Admin/Owner archives a user or product
1. Admin clicks "Delete" on a user or product
2. Before deleting, the full record is stored as JSON in `archive` table
3. The user/product is then removed from active tables
4. Item appears in "Archive" admin page

### Admin/Owner restores or permanently deletes archived items
1. Admin navigates to "Archive" page
2. Sees list of archived items with type and snapshot
3. Clicks "Restore" → re-inserts the item into its original table, removes from archive
4. Clicks "Delete Permanently" → removes from archive entirely

## Database Queries Summary

### Fetch conversations with messages (user view)
```sql
SELECT * FROM conversations c
  LEFT JOIN messages m ON c.id = m.conversation_id
  WHERE c.user_id = $USER_ID
  ORDER BY c.created_at DESC
```

### Fetch conversations with messages (admin view)
```sql
SELECT * FROM conversations c
  LEFT JOIN messages m ON c.id = m.conversation_id
  ORDER BY c.created_at DESC
```

### Mark admin/owner messages as read (when user opens)
```sql
UPDATE messages
  SET is_read = true
  WHERE conversation_id = $CONV_ID
    AND is_read = false
    AND sender_role IN ('admin', 'owner')
```

### Mark user messages as read (when admin opens)
```sql
UPDATE messages
  SET is_read = true
  WHERE conversation_id = $CONV_ID
    AND is_read = false
    AND sender_role = 'user'
```

### Get unread count for user
```sql
SELECT COUNT(*) FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = $USER_ID
    AND m.is_read = false
    AND m.sender_role IN ('admin', 'owner')
```

### Get unread count for admin
```sql
SELECT COUNT(*) FROM messages
  WHERE is_read = false
    AND sender_role = 'user'
```

## Migration Steps for Your Supabase Project

1. **Backup your database** (important!)
2. Open Supabase dashboard → SQL Editor
3. Copy the entire SQL from `supabase/migrations/20251203_create_conversations_messages_archive.sql`
4. Paste and execute in the SQL Editor
5. Verify that:
   - `conversations` table exists with 4 columns
   - `messages` table exists with 7 columns
   - `archive` table exists with 5 columns
   - RLS policies are created (check "Policies" tab for each table)
6. Test: Submit a contact form, verify it creates a conversation and message

## Backward Compatibility Notes

**Deprecated:**
- `contact_messages` table (still exists but no longer used by new code)
- `mailbox` table (replaced by `messages` table)
- `archived_profiles` table (replaced by `archive` table)

The old tables can be safely ignored or dropped after verifying the new system works.

## Type Definitions

Updated `src/lib/supabase.ts` with new types:

```typescript
export type Conversation = {
  id: string;
  user_id: string;
  subject: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_name: string | null;
  sender_role: 'user' | 'admin' | 'owner';
  body: string;
  is_read: boolean;
  created_at: string;
};

export type Archive = {
  id: string;
  type: string;
  original_id: string | null;
  before_data: any;
  deleted_by: string | null;
  deleted_at: string;
};
```

## Next Steps for User

1. **Run the migration** in your Supabase SQL Editor
2. **Test the contact form** → submit a test message
3. **Check the mailbox** as the user who submitted
4. **Reply as admin** and verify unread counts update
5. **Test archive** → delete a product or user, verify it appears in admin archive
6. **Test restore** → restore an archived item, verify it reappears in main list

## Troubleshooting

**Issue:** "relation 'conversations' does not exist"
- **Solution:** Run the migration SQL in Supabase SQL Editor

**Issue:** RLS policy errors when inserting messages
- **Solution:** Check that your Supabase auth.uid() and profiles.role are set correctly

**Issue:** Unread count not updating
- **Solution:** Verify `postgres_changes` subscription is active (check browser console)

**Issue:** Archive item restore fails
- **Solution:** Ensure the archived item's original table still exists and has the same schema
