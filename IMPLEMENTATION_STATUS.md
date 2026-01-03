# Read/Unread System, Message Display & Archive - Implementation Status

## ✅ COMPLETE: All 3 Features Implemented

---

## 1) Read/Unread System

### Database Schema
**Table: `messages`**
- `id` (uuid)
- `conversation_id` (uuid)
- `sender_name` (text)
- `sender_role` ('user' | 'admin' | 'owner')
- `body` (text)
- `is_read` (boolean) ← tracks read/unread status
- `created_at` (timestamptz)

### Logic Implementation

#### User Opens Conversation
**File:** `src/pages/MailboxPage.tsx` (line 47-63)
```typescript
const openConversation = async (conversationId: string) => {
  setActiveConversation(conversationId);
  // Marks all admin/owner messages as read
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .in('sender_role', ['admin', 'owner'])
    .eq('is_read', false);
  // ...
};
```

#### Admin/Owner Opens Conversation
**File:** `src/pages/admin/AdminMessages.tsx` (line 64-80)
```typescript
const openConversation = async (conversationId: string) => {
  setActiveConversation(conversationId);
  // Marks all user messages as read
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .eq('sender_role', 'user');
  // ...
};
```

### Navbar Unread Badge
**File:** `src/components/Navbar.tsx` (line 40-72)

**For Users:** Shows count of unread admin/owner messages
```typescript
const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .in('conversation_id', ids)
  .eq('is_read', false)
  .in('sender_role', ['admin', 'owner']);
```

**For Admins/Owners:** Shows count of unread user messages
```typescript
const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('is_read', false)
  .eq('sender_role', 'user');
```

**Real-time Updates:** Subscribes to `messages` table changes
```typescript
const channel = supabase
  .channel('messages_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
    fetchMailboxCount();
  })
  .subscribe();
```

### Per-Conversation Unread Count
**File:** `src/pages/MailboxPage.tsx` (line 35-37)
```typescript
const unread = msgs.filter((m: any) => !m.is_read && (m.sender_role === 'admin' || m.sender_role === 'owner')).length;
return { conversation: {...}, messages: msgs, unreadCount: unread };
```

**File:** `src/pages/admin/AdminMessages.tsx` (line 36-39)
```typescript
const unread = msgs.filter((m: any) => !m.is_read && m.sender_role === 'user').length;
```

Shows badge in conversation list:
```tsx
{t.unreadCount > 0 && (
  <div className="bg-rose-500 text-white text-xs rounded-full">
    {t.unreadCount}
  </div>
)}
```

---

## 2) Message Display

### Conversation Header Format
**File:** `src/pages/MailboxPage.tsx` (line 153-156)
```tsx
<div className="flex items-center justify-between">
  <div className="text-lg font-semibold text-gray-900">{profile?.full_name} — {new Date(thread.conversation.created_at).toLocaleDateString()}</div>
  <div className="text-sm text-gray-500">Conversation ID: {thread.conversation.id}</div>
</div>
```

**Format:** "User Name — Date" on one line ✓

### Message Display with Timestamp
**File:** `src/pages/MailboxPage.tsx` (line 169-176)
```tsx
{thread.messages.map((m) => (
  <div key={m.id} className={`px-6 py-4 ${m.sender_role === 'user' ? 'bg-blue-50' : 'bg-white'}`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="font-medium text-gray-900">{m.sender_name || (m.sender_role === 'user' ? (profile?.full_name || profile?.email) : 'Admin')}</p>
      </div>
      <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
    </div>
    <p className="text-gray-700 whitespace-pre-wrap">{m.body}</p>
    <div className="text-right text-xs text-gray-400 mt-3">{new Date(m.created_at).toLocaleString()}</div>
  </div>
))}
```

**Display:**
- Sender name at top-left
- Timestamp at top-right AND bottom-right ✓
- Message body in middle
- Different background colors for user (blue-50) vs admin (white) messages

### Admin Messages Display
**File:** `src/pages/admin/AdminMessages.tsx` (line 227-240)

Same format as user mailbox, with "View Details" button for each message ✓

---

## 3) Archive System (Delete → Move to Archive)

### Database Schema
**Table: `archive`**
```sql
CREATE TABLE IF NOT EXISTS public.archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,              -- 'profile', 'product', 'conversation', etc.
  original_id uuid,                 -- ID of the original deleted item
  before_data jsonb NOT NULL,       -- JSON snapshot of deleted record
  deleted_by uuid,                  -- Admin/owner who performed delete
  deleted_at timestamptz NOT NULL DEFAULT now()
);
```

### Delete Operations → Archive

#### Delete User
**File:** `src/pages/admin/AdminUsers.tsx` (line 50-72)
```typescript
const handleDeleteUser = async (userId: string) => {
  // 1. Fetch full profile snapshot
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // 2. Insert into archive with JSON snapshot
  const { error: archErr } = await supabase.from('archive').insert({
    type: 'profile',
    original_id: userId,
    before_data: profileRow,
    deleted_by: null
  });

  // 3. Remove from active table
  await supabase.from('profiles').delete().eq('id', userId);
};
```

#### Delete Product
**File:** `src/pages/admin/AdminProducts.tsx` (line 201-226)
```typescript
const handleDelete = async (id: string) => {
  // 1. Fetch full product snapshot
  const { data: prodRow } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // 2. Insert into archive
  const { error: archErr } = await supabase.from('archive').insert({
    type: 'product',
    original_id: id,
    before_data: prodRow,
    deleted_by: null
  });

  // 3. Remove from products table
  await supabase.from('products').delete().eq('id', id);
};
```

#### Archive Conversation
**File:** `src/pages/admin/AdminMessages.tsx` (line 93-117)
```typescript
const archiveConversation = async (conversationId: string) => {
  // 1. Fetch full conversation + messages snapshot
  const { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId);

  // 2. Store JSON snapshot in archive
  const before = { conversation: conv, messages: msgs };
  await supabase.from('archive').insert({
    type: 'conversation',
    original_id: conversationId,
    before_data: before,
    deleted_by: profile?.id
  });

  // 3. Delete conversation (cascades to messages)
  await supabase.from('conversations').delete().eq('id', conversationId);
};
```

### Archive Page
**File:** `src/pages/admin/AdminArchive.tsx`

#### View Archived Items
```typescript
const fetchArchive = async () => {
  const { data } = await supabase
    .from('archive')
    .select('*')
    .order('deleted_at', { ascending: false });
  setItems(data || []);
};
```

Display shows:
- Type (profile/product/conversation/etc.)
- Original ID
- Full JSON snapshot of `before_data`
- Deleted timestamp

#### Restore Item
```typescript
const restore = async (item: any) => {
  if (item.type === 'profile') {
    await supabase.from('profiles').insert(item.before_data);
  } else if (item.type === 'product') {
    await supabase.from('products').insert(item.before_data);
  } else if (item.type === 'conversation') {
    // Re-insert conversation + nested messages
    const conv = item.before_data.conversation;
    const msgs = item.before_data.messages || [];
    await supabase.from('conversations').insert(conv);
    if (msgs.length) {
      const msgsToInsert = msgs.map((m: any) => ({ ...m, conversation_id: conv.id }));
      await supabase.from('messages').insert(msgsToInsert);
    }
  }
  // Remove from archive after restore
  await supabase.from('archive').delete().eq('id', item.id);
};
```

#### Permanent Delete
```typescript
const removePermanent = async (item: any) => {
  if (!confirm('Permanently delete this archived item? This cannot be undone.')) return;
  await supabase.from('archive').delete().eq('id', item.id);
};
```

---

## User Flow Examples

### User Submits Contact Form
1. User fills "Contact Us" form
2. Form submits → creates `conversations` row
3. Creates first `messages` row with `sender_role: 'user'`, `is_read: false`
4. Success message shown

### User Checks Mailbox
1. Navigate to "Mailbox"
2. Page fetches conversations with nested messages
3. Left sidebar shows conversation list with unread count badge
4. **User clicks conversation** → marks all admin/owner messages as read ✓
5. Right side shows threaded messages chronologically
6. User can reply (inserts new message with `sender_role: 'user'`)
7. Navbar badge updates in real-time ✓

### Admin Reviews Messages
1. Navigate to "Messages"
2. Page lists all conversations
3. **Admin clicks conversation** → marks all user messages as read ✓
4. Conversation view shows threaded messages
5. Unread count badge shows number of unread user messages
6. Admin can reply (inserts message with `sender_role: 'admin'`)
7. Admin can "View Details" on any message (opens modal)
8. Admin can "Archive" conversation (stores JSON snapshot, removes from active) ✓

### Admin Deletes User
1. Admin navigates to Admin → Users
2. Clicks "Delete" on a user
3. **Before deleting**, user's full profile is saved to `archive` table as JSON
4. User is removed from `profiles` table
5. User no longer appears in Users list
6. User appears in Admin → Archive page ✓

### Admin/Owner Restores Archived Item
1. Navigate to Admin → Archive
2. See list of archived items with type and JSON snapshot
3. Click "Restore" button
4. **Original record is re-inserted** into its original table ✓
5. Item removed from archive
6. Item reappears in main list (Products, Users, Messages, etc.)

### Admin/Owner Permanently Deletes Archived Item
1. Navigate to Admin → Archive
2. Click "Delete Permanently" button
3. Item completely removed from archive ✓

---

## Real-time Updates

### Navbar Badge Updates
- Subscribes to `messages` table via `postgres_changes`
- Triggers on INSERT, UPDATE, DELETE
- Automatically updates unread count when new messages arrive
- Works for both users and admins

### Conversation List Updates
- When conversation is opened, unread count badge disappears
- Happens instantly after `is_read: true` update

---

## Summary

| Feature | Status | Files |
|---------|--------|-------|
| **Read/Unread Toggle** | ✅ Complete | MailboxPage.tsx, AdminMessages.tsx |
| **Navbar Badge** | ✅ Complete | Navbar.tsx |
| **Per-Conversation Badges** | ✅ Complete | MailboxPage.tsx, AdminMessages.tsx |
| **Real-time Updates** | ✅ Complete | Navbar.tsx (postgres_changes) |
| **Message Display with Timestamps** | ✅ Complete | MailboxPage.tsx, AdminMessages.tsx |
| **Conversation Header Format** | ✅ Complete | MailboxPage.tsx |
| **Delete → Archive** | ✅ Complete | AdminUsers.tsx, AdminProducts.tsx, AdminMessages.tsx |
| **Archive Table** | ✅ Complete | Migration SQL, AdminArchive.tsx |
| **Restore from Archive** | ✅ Complete | AdminArchive.tsx |
| **Permanent Delete** | ✅ Complete | AdminArchive.tsx |

---

## What to Test

1. **Submit contact form** → Conversation created
2. **User opens mailbox** → Admin messages marked read, badge disappears
3. **Admin opens conversation** → User messages marked read, badge decreases
4. **Send reply** → New message appears, unread status correct
5. **Navbar badge** → Updates in real-time when new messages arrive
6. **Delete user/product** → Item moves to archive (not hard deleted)
7. **View archive** → Archived items appear with JSON snapshot
8. **Restore item** → Re-appears in main list, removed from archive
9. **Permanent delete** → Removed entirely from archive

All functionality is ready to use after running the migration! 🎉
