-- Migration: Fix RLS policies for admin/owner operations and enable hard delete

-- ==============================
-- CREATE MISSING TABLES
-- ==============================

-- Create favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create mailbox table if it doesn't exist
CREATE TABLE IF NOT EXISTS mailbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id uuid REFERENCES contact_messages(id) ON DELETE CASCADE,
  from_email text NOT NULL,
  from_name text,
  to_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create archived_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS archived_profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  role text,
  phone text,
  avatar_url text,
  archived_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================
-- PRODUCTS TABLE RLS POLICIES
-- ==============================

-- Drop existing product policies (both old and new names)
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins and owners can insert products" ON products;
DROP POLICY IF EXISTS "Admins and owners can update products" ON products;
DROP POLICY IF EXISTS "Admins and owners can delete products" ON products;

-- Create new policies that allow both admin and owner roles
CREATE POLICY "Admins and owners can insert products"
ON products FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins and owners can update products"
ON products FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins and owners can delete products"
ON products FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ==============================
-- PROFILES TABLE RLS POLICIES
-- ==============================

-- Drop existing role update policy
DROP POLICY IF EXISTS "Owners can update user roles" ON profiles;
DROP POLICY IF EXISTS "Only owners can update user roles" ON profiles;
DROP POLICY IF EXISTS "Only owners can delete users" ON profiles;

-- Create new policy allowing only owners to update roles
CREATE POLICY "Only owners can update user roles"
ON profiles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

-- Policy for owners to delete users (hard delete)
CREATE POLICY "Only owners can delete users"
ON profiles FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

-- ==============================
-- CONTACT_MESSAGES TABLE RLS POLICIES
-- ==============================

-- Ensure anyone (authenticated or anon) can insert contact messages
-- Drop and recreate to ensure correct state
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins and owners can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins and owners can update contact messages" ON contact_messages;

CREATE POLICY "Anyone can insert contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- Admins and owners can select contact messages
CREATE POLICY "Admins and owners can view contact messages"
ON contact_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Admins and owners can update contact messages
CREATE POLICY "Admins and owners can update contact messages"
ON contact_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ==============================
-- MAILBOX TABLE RLS POLICIES
-- ==============================

DROP POLICY IF EXISTS "Admins can insert mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Admins can view mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Admins and owners can insert mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Users can view mailbox messages sent to them" ON mailbox;

-- Admins and owners can insert mailbox messages (replies)
CREATE POLICY "Admins and owners can insert mailbox messages"
ON mailbox FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Users can select mailbox messages sent to their email
-- Admins/owners can select all mailbox messages
CREATE POLICY "Users can view mailbox messages sent to them"
ON mailbox FOR SELECT TO authenticated
USING (
  -- Users see messages sent to their email
  to_email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR
  -- Admins/owners see all messages
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ==============================
-- ARCHIVED_PROFILES TABLE RLS POLICIES
-- ==============================

DROP POLICY IF EXISTS "Admins can insert archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins can view archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins and owners can insert archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins and owners can view archived profiles" ON archived_profiles;

-- Admins and owners can insert archived profiles
CREATE POLICY "Admins and owners can insert archived profiles"
ON archived_profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- Admins and owners can view archived profiles
CREATE POLICY "Admins and owners can view archived profiles"
ON archived_profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ==============================
-- FAVORITES TABLE RLS POLICIES
-- ==============================

DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
ON favorites FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can select their own favorites
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE TO authenticated
USING (user_id = auth.uid());
