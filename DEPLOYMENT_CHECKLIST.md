# Deployment Checklist: Messaging & Archive System

## Phase 1: Database Migration (Required First)

### 1. Backup Your Database
- [ ] Go to Supabase Dashboard → Settings → Backups
- [ ] Create a manual backup before proceeding

### 2. Run Migration
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy entire contents of: `supabase/migrations/20251203_create_conversations_messages_archive.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" (green arrow)
- [ ] Wait for "Execution complete" message

### 3. Verify Tables Created
- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Verify you see these new tables:
  - [ ] `conversations`
  - [ ] `messages`
  - [ ] `archive`

### 4. Verify RLS Policies
- [ ] In Supabase Dashboard, click on `conversations` table
- [ ] Go to "Policies" tab
- [ ] You should see policies:
  - [ ] `allow_conversation_insert`
  - [ ] `allow_conversation_select`
- [ ] Repeat for `messages` and `archive` tables

---

## Phase 2: Frontend Code (All In Place)

All frontend components are already implemented:

- [ ] `src/pages/ContactUsPage.tsx` - creates conversations
- [ ] `src/pages/MailboxPage.tsx` - user mailbox with threaded view
- [ ] `src/pages/admin/AdminMessages.tsx` - admin inbox with conversation threads
- [ ] `src/pages/admin/AdminArchive.tsx` - archive management (restore/delete)
- [ ] `src/pages/admin/AdminUsers.tsx` - updated to archive users instead of hard delete
- [ ] `src/pages/admin/AdminProducts.tsx` - updated to archive products instead of hard delete
- [ ] `src/components/Navbar.tsx` - updated unread count badge
- [ ] `src/components/DetailsModal.tsx` - generic details viewer
- [ ] `src/lib/supabase.ts` - types: Conversation, Message, Archive

---

## Phase 3: Manual Testing

### Test Contact Form → Conversation
1. [ ] Navigate to "Contact Us" page
2. [ ] Fill out form:
   - Name: Test User
   - Email: test@example.com
   - Subject: Test Conversation
   - Message: Hello Admin
3. [ ] Click "Send Message"
4. [ ] Expect: "Thank you for your message..." (green message)
5. [ ] If error (red message): Check browser console for details

### Test User Mailbox
1. [ ] Sign in as the user who submitted contact form
2. [ ] Navigate to "Mailbox" (person icon → click badge or Mailbox in menu)
3. [ ] Expect: Conversation appears in left list
4. [ ] Click conversation → View opens on right
5. [ ] Expect: Shows user's initial message, timestamps visible
6. [ ] Type reply text → Click "Send"
7. [ ] Expect: Reply appears in thread below original message

### Test Admin Unread Count
1. [ ] Sign in as admin
2. [ ] Navbar person icon badge → should show unread count
3. [ ] If no badge, check browser console for subscription errors

### Test Admin Messages Page
1. [ ] Navigate to Admin → Messages
2. [ ] Expect: Conversation appears in left inbox list
3. [ ] Click to open → Conversation view shows right side
4. [ ] User messages should be marked read (blue dot disappears)
5. [ ] Admin types reply → Clicks "Send"
6. [ ] Expect: Admin reply appears in thread

### Test Archive
1. [ ] Navigate to Admin → Products
2. [ ] Click "Delete" on any product
3. [ ] Confirm deletion
4. [ ] Navigate to Admin → Archive
5. [ ] Expect: Product appears with type "product"
6. [ ] Click "View" → See full product JSON
7. [ ] Click "Restore" → Product re-appears in Products list
8. [ ] Repeat with Admin → Users

### Test Message Details Modal
1. [ ] In Admin Messages, open a conversation
2. [ ] Click "View Details" on any message
3. [ ] Modal opens showing full message data
4. [ ] Review the JSON, sender_name, body
5. [ ] Close modal

---

## Phase 4: Troubleshooting

### Problem: Migration SQL fails with "policy already exists"
**Solution:** This can happen if you run the migration twice. The SQL is idempotent (has DROP POLICY IF EXISTS), but if you still get errors:
- [ ] Go to each table (conversations, messages, archive)
- [ ] Click "Policies" tab
- [ ] Delete any conflicting policies manually
- [ ] Re-run the migration SQL

### Problem: Contact form submission shows "error: new row violates..."
**Solution:** RLS policy not allowing insert. Check:
- [ ] User is logged in (required for `auth.uid()`)
- [ ] `conversations` table has `allow_conversation_insert` policy
- [ ] Run query in Supabase SQL Editor (as authenticated user):
  ```sql
  SELECT * FROM conversations LIMIT 1;
  ```
- [ ] Should return 0 rows (empty) if no data, no error

### Problem: Unread badge not showing in Navbar
**Solution:** Subscription might not be active. Check:
- [ ] Open browser DevTools → Console
- [ ] Look for any console errors mentioning "postgres_changes" or "subscription"
- [ ] Try refreshing page
- [ ] Sign out and sign back in

### Problem: Archive restore fails with "Inserting the same primary key"
**Solution:** Archive item's original ID conflicts. This can happen if:
- [ ] The item was already restored
- [ ] The original table was cleared
**Action:** Delete the archived item permanently instead

---

## Phase 5: Production Considerations

- [ ] Test with multiple admin users replying to same conversation
- [ ] Verify performance with 100+ conversations
- [ ] Monitor Supabase database size (archive table stores JSON)
- [ ] Decide on archive cleanup policy (keep forever or delete after X days?)
- [ ] Document to users: "Deleting never removes data permanently; admins can always restore"

---

## Support & Questions

If you encounter issues:

1. Check the **MESSAGING_ARCHIVE_GUIDE.md** file for detailed documentation
2. Review the updated component code comments
3. Check Supabase logs: Dashboard → Logs → Auth, Realtime, Database
4. Verify RLS policies are correct (they allow reads/writes appropriately)

---

## Rollback Plan

If you need to revert to the old system:

1. Revert all TypeScript files from git (keeping them restores old imports/logic)
2. Keep the new tables in Supabase (they don't hurt anything if unused)
3. The old `contact_messages` table still exists and can be used again

---

## Success Criteria

You'll know the system is working when:

- [ ] Contact form creates a conversation + message in Supabase
- [ ] User sees conversation in their Mailbox
- [ ] User can reply and reply appears threaded
- [ ] Admin sees conversation unread count in inbox
- [ ] Admin marks messages read by opening conversation
- [ ] Navbar badge updates when new messages arrive
- [ ] Deleting users/products archives them (not hard delete)
- [ ] Archived items can be restored from Archive page
- [ ] Details modal shows full data for items

---

**Last Updated:** December 3, 2025
**Migration File:** `supabase/migrations/20251203_create_conversations_messages_archive.sql`
