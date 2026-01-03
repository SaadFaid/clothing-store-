-- Migration: Clean RLS policies - Drop all and recreate

-- ==============================
-- DROP ALL EXISTING POLICIES
-- ==============================

-- Drop all policies from products
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins and owners can insert products" ON products;
DROP POLICY IF EXISTS "Admins and owners can update products" ON products;
DROP POLICY IF EXISTS "Admins and owners can delete products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Drop all policies from profiles
DROP POLICY IF EXISTS "Owners can update user roles" ON profiles;
DROP POLICY IF EXISTS "Only owners can update user roles" ON profiles;
DROP POLICY IF EXISTS "Only owners can delete users" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;

-- Drop all policies from contact_messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins and owners can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins and owners can update contact messages" ON contact_messages;

-- Drop all policies from mailbox
DROP POLICY IF EXISTS "Admins can insert mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Admins can view mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Admins and owners can insert mailbox messages" ON mailbox;
DROP POLICY IF EXISTS "Users can view mailbox messages sent to them" ON mailbox;

-- Drop all policies from archived_profiles
DROP POLICY IF EXISTS "Admins can insert archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins can view archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins and owners can insert archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Admins and owners can view archived profiles" ON archived_profiles;

-- Drop all policies from favorites
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- ==============================
-- RECREATE ALL POLICIES
-- ==============================

-- ==============================
-- PRODUCTS TABLE RLS POLICIES
-- ==============================

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

CREATE POLICY "Anyone can view products"
ON products FOR SELECT
USING (true);

-- ==============================
-- PROFILES TABLE RLS POLICIES
-- ==============================

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

CREATE POLICY "Only owners can delete users"
ON profiles FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Anyone can view public profile data"
ON profiles FOR SELECT
USING (true);

-- ==============================
-- CONTACT_MESSAGES TABLE RLS POLICIES
-- ==============================

CREATE POLICY "Anyone can insert contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins and owners can view contact messages"
ON contact_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

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

CREATE POLICY "Admins and owners can insert mailbox messages"
ON mailbox FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Users can view mailbox messages sent to them"
ON mailbox FOR SELECT TO authenticated
USING (
  to_email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ==============================
-- ARCHIVED_PROFILES TABLE RLS POLICIES
-- ==============================

CREATE POLICY "Admins and owners can insert archived profiles"
ON archived_profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

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

CREATE POLICY "Users can insert their own favorites"
ON favorites FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE TO authenticated
USING (user_id = auth.uid());
