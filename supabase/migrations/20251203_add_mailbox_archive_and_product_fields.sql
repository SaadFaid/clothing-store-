-- Full migration: mailbox, archived flag, archived_profiles, product tax/shipping, mailbox read/sender info
BEGIN;

-- 1️⃣ Add archived boolean to contact_messages
ALTER TABLE IF EXISTS contact_messages
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- 2️⃣ Create mailbox table for messages sent by admins to users
CREATE TABLE IF NOT EXISTS mailbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_user_id uuid NULL,
  from_name text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,           -- track if the message has been read by the user
  sender_role text DEFAULT 'admin',        -- 'admin' or 'user'
  created_at timestamptz DEFAULT now()
);

-- 3️⃣ Create archived_profiles table to keep deleted user snapshots
CREATE TABLE IF NOT EXISTS archived_profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  role text,
  phone text,
  avatar_url text,
  deleted_at timestamptz DEFAULT now()
);

-- 4️⃣ Add tax and shipping_cost fields to products
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS tax decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost decimal(10,2) DEFAULT 0;

-- 5️⃣ Create archive table for deleted items
CREATE TABLE IF NOT EXISTS archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'conversation', 'message', etc.
  original_id uuid NOT NULL,
  before_data jsonb,
  deleted_by uuid,
  deleted_at timestamptz DEFAULT now()
);

COMMIT;
