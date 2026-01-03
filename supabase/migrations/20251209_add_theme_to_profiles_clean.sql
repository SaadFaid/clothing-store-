
ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark'));

UPDATE profiles SET theme = 'light' WHERE theme IS NULL;
