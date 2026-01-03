-- Migration: Create missing tables (favorites, mailbox, archived_profiles)

-- ==============================
-- FAVORITES TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ==============================
-- MAILBOX TABLE
-- ==============================
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

ALTER TABLE mailbox ENABLE ROW LEVEL SECURITY;

-- ==============================
-- ARCHIVED_PROFILES TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS archived_profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  role text,
  phone text,
  avatar_url text,
  archived_at timestamptz DEFAULT now()
);

ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ==============================

-- Add archived column to contact_messages if it doesn't exist
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS replied boolean DEFAULT false;

-- Add tax and shipping_cost columns to products if they don't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS tax decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost decimal(10,2) DEFAULT 0;
