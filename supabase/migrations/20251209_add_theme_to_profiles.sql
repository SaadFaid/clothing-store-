-- Migration: Add theme column to profiles table

ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark'));

-- Update existing profiles to have a default theme if not set
UPDATE profiles SET theme = 'light' WHERE theme IS NULL;
