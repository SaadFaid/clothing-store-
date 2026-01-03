-- Create images storage bucket for product images
-- Note: This SQL creates the bucket configuration, but the actual bucket
-- needs to be created through the Supabase dashboard or CLI

-- Insert bucket configuration (this is for reference - actual bucket creation is done via API)
-- The bucket should be created with:
-- Name: images
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- To create the bucket via Supabase dashboard:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Storage
-- 3. Click "Create bucket"
-- 4. Name it "images"
-- 5. Make it public
-- 6. Set file size limit to 10MB
-- 7. Allow MIME types: image/*

-- Alternative: Use this SQL in a migration (requires pgsql extensions)
-- But it's recommended to create via dashboard or CLI for storage buckets

-- For reference, here's how you would create it programmatically:
-- This would be run in your application code, not as SQL

/*
-- Programmatic bucket creation (run this in your app, not as SQL):
await supabase.storage.createBucket('images', {
  public: true,
  allowedMimeTypes: ['image/*'],
  fileSizeLimit: 10485760 // 10MB
});
*/

-- If you need to run this as SQL, you can use the following approach:
-- (This requires the pg_net extension and proper permissions)

DO $$
BEGIN
  -- This is a placeholder - actual bucket creation must be done via API
  RAISE NOTICE 'Please create the images bucket via Supabase dashboard or CLI';
  RAISE NOTICE 'Bucket name: images';
  RAISE NOTICE 'Public: true';
  RAISE NOTICE 'File size limit: 10MB';
  RAISE NOTICE 'Allowed MIME types: image/*';
END $$;
