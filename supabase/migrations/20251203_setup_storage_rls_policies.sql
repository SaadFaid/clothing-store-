-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload images to the 'images' bucket
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view images from the 'images' bucket
CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploaded images
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own uploaded images
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view images (since bucket is public)
CREATE POLICY "Allow public to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
);

-- Alternative: If you want to allow all authenticated users to manage all images in the products folder
-- (more permissive for admin use case)

DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

-- Allow all authenticated users to upload to products folder
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

-- Allow all authenticated users to view product images
CREATE POLICY "Allow authenticated users to view product images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'products'
);

-- Allow all authenticated users to update product images
CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

-- Allow all authenticated users to delete product images
CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);
