-- Sample Data for E-Commerce Database
-- This file contains sample data to populate the database after running the schema setup

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Men''s Tops', 'mens-tops', 'T-shirts, shirts, and tops for men', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
('Men''s Bottoms', 'mens-bottoms', 'Pants, jeans, and bottoms for men', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'),
('Women''s Tops', 'womens-tops', 'Blouses, shirts, and tops for women', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'),
('Women''s Bottoms', 'womens-bottoms', 'Pants, skirts, and bottoms for women', 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=400'),
('Footwear', 'footwear', 'Shoes and footwear for all', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'),
('Accessories', 'accessories', 'Accessories for all', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
('Electronics', 'electronics', 'Electronic gadgets and devices', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'),
('Books & Media', 'books-media', 'Books, movies, and media products', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products (30 products)
INSERT INTO products (name, slug, description, price, compare_at_price, category_id, images, sizes, colors, stock_quantity, is_active, featured, tax, shipping_cost) VALUES
('Classic Cotton T-Shirt', 'classic-cotton-t-shirt', 'Comfortable 100% cotton t-shirt perfect for everyday wear', 19.99, 24.99,
 (SELECT id FROM categories WHERE slug = 'mens-tops'),
 '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"]',
 '["S", "M", "L", "XL", "XXL"]', '["White", "Black", "Navy", "Gray"]', 50, true, true, 0.00, 5.99),

('Slim Fit Jeans', 'slim-fit-jeans', 'Modern slim fit jeans with stretch comfort', 59.99, 79.99,
 (SELECT id FROM categories WHERE slug = 'mens-bottoms'),
 '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"]',
 '["28", "30", "32", "34", "36", "38"]', '["Dark Blue", "Black", "Light Blue"]', 25, true, true, 0.00, 7.99),

('Women''s Summer Dress', 'womens-summer-dress', 'Light and airy summer dress perfect for warm weather', 39.99, 49.99,
 (SELECT id FROM categories WHERE slug = 'womens-tops'),
 '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"]',
 '["XS", "S", "M", "L", "XL"]', '["Floral", "Blue", "White", "Black"]', 30, true, false, 0.00, 6.99),

('Running Shoes', 'running-shoes', 'Comfortable running shoes with advanced cushioning', 89.99, 109.99,
 (SELECT id FROM categories WHERE slug = 'footwear'),
 '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"]',
 '["7", "8", "9", "10", "11", "12"]', '["Black", "White", "Gray"]', 40, true, true, 0.00, 9.99),

('Leather Wallet', 'leather-wallet', 'Genuine leather wallet with multiple card slots', 29.99, 39.99,
 (SELECT id FROM categories WHERE slug = 'accessories'),
 '[]', '[]', '["Black", "Brown", "Tan"]', 60, true, false, 0.00, 4.99),

('Wireless Headphones', 'wireless-headphones', 'Premium wireless headphones with noise cancellation', 149.99, 199.99,
 (SELECT id FROM categories WHERE slug = 'electronics'),
 '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"]',
 '[]', '["Black", "White", "Silver"]', 35, true, true, 0.00, 8.99),

('Smart Watch', 'smart-watch', 'Feature-rich smartwatch with health monitoring', 299.99, 349.99,
 (SELECT id FROM categories WHERE slug = 'electronics'),
 '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"]',
 '[]', '["Black", "Silver", "Gold"]', 20, true, true, 0.00, 12.99),

('Garden Hose', 'garden-hose', 'Durable garden hose with brass connectors', 24.99, 29.99,
 (SELECT id FROM categories WHERE slug = 'home-garden'),
 '["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"]',
 '["25ft", "50ft", "75ft"]', '["Green", "Black"]', 45, true, false, 0.00, 6.99),

('Yoga Mat', 'yoga-mat', 'Non-slip yoga mat for all fitness levels', 34.99, 44.99,
 (SELECT id FROM categories WHERE slug = 'sports-outdoors'),
 '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"]',
 '[]', '["Purple", "Blue", "Pink", "Gray"]', 55, true, false, 0.00, 7.99),

('Programming Book', 'programming-book', 'Comprehensive guide to modern programming', 49.99, 59.99,
 (SELECT id FROM categories WHERE slug = 'books-media'),
 '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"]',
 '[]', '[]', 80, true, false, 0.00, 4.99),

('Men''s Polo Shirt', 'mens-polo-shirt', 'Classic polo shirt made from breathable fabric', 27.99, 34.99,
 (SELECT id FROM categories WHERE slug = 'mens-tops'),
 '["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400"]',
 '["S", "M", "L", "XL", "XXL"]', '["White", "Navy", "Red", "Green"]', 40, true, false, 0.00, 5.99),

('Women''s Leggings', 'womens-leggings', 'High-quality leggings for yoga and casual wear', 32.99, 39.99,
 (SELECT id FROM categories WHERE slug = 'womens-bottoms'),
 '["https://images.unsplash.com/photo-1506629905607-0b5b4b3b3b5b?w=400"]',
 '["XS", "S", "M", "L", "XL"]', '["Black", "Gray", "Navy"]', 35, true, false, 0.00, 6.99),

('Casual Sneakers', 'casual-sneakers', 'Comfortable sneakers for everyday wear', 69.99, 89.99,
 (SELECT id FROM categories WHERE slug = 'footwear'),
 '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"]',
 '["6", "7", "8", "9", "10", "11"]', '["White", "Black", "Blue"]', 30, true, false, 0.00, 8.99),

('Sunglasses', 'sunglasses', 'UV protection sunglasses with polarized lenses', 79.99, 99.99,
 (SELECT id FROM categories WHERE slug = 'accessories'),
 '["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400"]',
 '[]', '["Black", "Brown", "Silver"]', 25, true, false, 0.00, 5.99),

('Bluetooth Speaker', 'bluetooth-speaker', 'Portable wireless speaker with excellent sound quality', 59.99, 79.99,
 (SELECT id FROM categories WHERE slug = 'electronics'),
 '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"]',
 '[]', '["Black", "White", "Blue"]', 40, true, true, 0.00, 7.99),

('Fitness Tracker', 'fitness-tracker', 'Advanced fitness tracker with heart rate monitoring', 89.99, 119.99,
 (SELECT id FROM categories WHERE slug = 'electronics'),
 '["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400"]',
 '[]', '["Black", "Pink", "Blue"]', 50, true, false, 0.00, 6.99),

('Garden Tools Set', 'garden-tools-set', 'Complete set of essential garden tools', 39.99, 49.99,
 (SELECT id FROM categories WHERE slug = 'home-garden'),
 '["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"]',
 '[]', '[]', 30, true, false, 0.00, 9.99),

('Camping Tent', 'camping-tent', 'Waterproof camping tent for 4 people', 129.99, 159.99,
 (SELECT id FROM categories WHERE slug = 'sports-outdoors'),
 '["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=400"]',
 '[]', '["Green", "Blue", "Gray"]', 15, true, false, 0.00, 15.99),

('Cookbook Collection', 'cookbook-collection', 'Set of 5 gourmet cookbooks', 69.99, 89.99,
 (SELECT id FROM categories WHERE slug = 'books-media'),
 '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"]',
 '[]', '[]', 20, true, false, 0.00, 8.99),

('Men''s Dress Shirt', 'mens-dress-shirt', 'Formal dress shirt for business and events', 44.99, 54.99,
 (SELECT id FROM categories WHERE slug = 'mens-tops'),
 '["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400"]',
 '["14.5", "15", "15.5", "16", "16.5", "17"]', '["White", "Light Blue", "Gray"]', 28, true, false, 0.00, 6.99),

('Women''s Blouse', 'womens-blouse', 'Elegant blouse perfect for office wear', 36.99, 46.99,
 (SELECT id FROM categories WHERE slug = 'womens-tops'),
 '["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400"]',
 '["XS", "S", "M", "L", "XL"]', '["White", "Black", "Navy", "Red"]', 32, true, false, 0.00, 6.99),

('Cargo Pants', 'cargo-pants', 'Durable cargo pants with multiple pockets', 49.99, 64.99,
 (SELECT id FROM categories WHERE slug = 'mens-bottoms'),
 '["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400"]',
 '["30", "32", "34", "36", "38", "40"]', '["Khaki", "Black", "Olive"]', 22, true, false, 0.00, 7.99),

('Women''s Skirt', 'womens-skirt', 'Flowy skirt for casual and formal occasions', 29.99, 39.99,
 (SELECT id FROM categories WHERE slug = 'womens-bottoms'),
 '["https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=400"]',
 '["XS", "S", "M", "L", "XL"]', '["Black", "Navy", "Gray", "Floral"]', 38, true, false, 0.00, 6.99),

('Hiking Boots', 'hiking-boots', 'Rugged hiking boots for outdoor adventures', 119.99, 149.99,
 (SELECT id FROM categories WHERE slug = 'footwear'),
 '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"]',
 '["7", "8", "9", "10", "11", "12"]', '["Brown", "Black"]', 18, true, false, 0.00, 11.99),

('Belt', 'belt', 'Genuine leather belt with classic buckle', 24.99, 34.99,
 (SELECT id FROM categories WHERE slug = 'accessories'),
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"]',
 '["32", "34", "36", "38", "40", "42"]', '["Black", "Brown", "Tan"]', 45, true, false, 0.00, 4.99),

('Tablet', 'tablet', '10-inch tablet with high-resolution display', 299.99, 399.99,
 (SELECT id FROM categories WHERE slug = 'electronics'),
 '["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"]',
 '[]', '["Black", "White", "Silver"]', 25, true, true, 0.00, 10.99),

('Dumbbells Set', 'dumbbells-set', 'Adjustable dumbbells from 5-50 lbs', 199.99, 249.99,
 (SELECT id FROM categories WHERE slug = 'sports-outdoors'),
 '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"]',
 '[]', '[]', 12, true, false, 0.00, 19.99),

('Decorative Pillow Set', 'decorative-pillow-set', 'Set of 4 decorative throw pillows', 39.99, 49.99,
 (SELECT id FROM categories WHERE slug = 'home-garden'),
 '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"]',
 '[]', '["Beige", "Gray", "Blue", "Green"]', 28, true, false, 0.00, 8.99),

('Movie Collection', 'movie-collection', 'Box set of classic movies', 79.99, 99.99,
 (SELECT id FROM categories WHERE slug = 'books-media'),
 '["https://images.unsplash.com/photo-1489599735734-79b4e3b0c8b?w=400"]',
 '[]', '[]', 15, true, false, 0.00, 9.99)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample profiles (10 profiles)
-- NOTE: Profiles require corresponding users in auth.users table first.
-- Uncomment the following INSERT after creating users in auth.users with matching UUIDs.
INSERT INTO profiles (id, email, full_name, role, phone, avatar_url, theme) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Admin User', 'admin', '+1234567890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'light'),
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe', 'user', '+1234567891', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 'light'),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith', 'user', '+1234567892', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', 'dark'),
('550e8400-e29b-41d4-a716-446655440003', 'mike.johnson@example.com', 'Mike Johnson', 'user', '+1234567893', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'light'),
('550e8400-e29b-41d4-a716-446655440004', 'sarah.wilson@example.com', 'Sarah Wilson', 'user', '+1234567894', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'dark'),
('550e8400-e29b-41d4-a716-446655440005', 'david.brown@example.com', 'David Brown', 'user', '+1234567895', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', 'light'),
('550e8400-e29b-41d4-a716-446655440006', 'lisa.davis@example.com', 'Lisa Davis', 'user', '+1234567896', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa', 'light'),
('550e8400-e29b-41d4-a716-446655440007', 'chris.miller@example.com', 'Chris Miller', 'user', '+1234567897', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris', 'dark'),
('550e8400-e29b-41d4-a716-446655440008', 'amy.garcia@example.com', 'Amy Garcia', 'user', '+1234567898', 'https://api.dicebear.com/7.x/avataaars/svg?seed=amy', 'light'),
('550e8400-e29b-41d4-a716-446655440009', 'tom.anderson@example.com', 'Tom Anderson', 'user', '+1234567899', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', 'light');

-- Insert sample addresses (10 addresses)
-- NOTE: Addresses require corresponding users in auth.users table first.
-- Uncomment the following INSERT after creating users in auth.users with matching UUIDs.
INSERT INTO addresses (user_id, full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'US', '+1234567891', true),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', '456 Oak Avenue', NULL, 'Los Angeles', 'CA', '90210', 'US', '+1234567892', true),
('550e8400-e29b-41d4-a716-446655440003', 'Mike Johnson', '789 Pine Road', 'Suite 200', 'Chicago', 'IL', '60601', 'US', '+1234567893', true),
('550e8400-e29b-41d4-a716-446655440004', 'Sarah Wilson', '321 Elm Street', NULL, 'Houston', 'TX', '77001', 'US', '+1234567894', true),
('550e8400-e29b-41d4-a716-446655440005', 'David Brown', '654 Maple Drive', 'Unit 15', 'Phoenix', 'AZ', '85001', 'US', '+1234567895', true),
('550e8400-e29b-41d4-a716-446655440006', 'Lisa Davis', '987 Cedar Lane', NULL, 'Philadelphia', 'PA', '19101', 'US', '+1234567896', true),
('550e8400-e29b-41d4-a716-446655440007', 'Chris Miller', '147 Birch Boulevard', 'Floor 3', 'San Antonio', 'TX', '78201', 'US', '+1234567897', true),
('550e8400-e29b-41d4-a716-446655440008', 'Amy Garcia', '258 Spruce Street', NULL, 'San Diego', 'CA', '92101', 'US', '+1234567898', true),
('550e8400-e29b-41d4-a716-446655440009', 'Tom Anderson', '369 Willow Way', 'Apt 2C', 'Dallas', 'TX', '75201', 'US', '+1234567899', true),
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', '555 Business Blvd', 'Office 100', 'New York', 'NY', '10002', 'US', '+1234567891', false);

-- Insert sample cart items (10 cart items)
-- NOTE: Cart items require corresponding users in auth.users table first.
-- Uncomment the following INSERT after creating users in auth.users with matching UUIDs.
INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE slug = 'classic-cotton-t-shirt'), 2, 'M', 'Black'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE slug = 'womens-summer-dress'), 1, 'M', 'Floral'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE slug = 'wireless-headphones'), 1, NULL, 'Black'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM products WHERE slug = 'running-shoes'), 1, '8', 'White'),
('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM products WHERE slug = 'smart-watch'), 1, NULL, 'Black'),
('550e8400-e29b-41d4-a716-446655440006', (SELECT id FROM products WHERE slug = 'yoga-mat'), 1, NULL, 'Purple'),
('550e8400-e29b-41d4-a716-446655440007', (SELECT id FROM products WHERE slug = 'leather-wallet'), 1, NULL, 'Brown'),
('550e8400-e29b-41d4-a716-446655440008', (SELECT id FROM products WHERE slug = 'bluetooth-speaker'), 1, NULL, 'White'),
('550e8400-e29b-41d4-a716-446655440009', (SELECT id FROM products WHERE slug = 'programming-book'), 1, NULL, NULL),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE slug = 'slim-fit-jeans'), 1, '32', 'Dark Blue');

-- Insert sample orders (10 orders)
-- NOTE: Orders require corresponding users in auth.users table first.
-- Uncomment the following INSERT after creating users in auth.users with matching UUIDs.
INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping_fee, total, shipping_address, payment_method, payment_status, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'ORD-20241201-0001', 'delivered', 79.98, 6.40, 5.99, 92.37,
 '{"full_name": "John Doe", "address_line1": "123 Main Street", "address_line2": "Apt 4B", "city": "New York", "state": "NY", "postal_code": "10001", "country": "US", "phone": "+1234567891"}',
 'credit_card', 'completed', 'Leave at front door'),
('550e8400-e29b-41d4-a716-446655440002', 'ORD-20241201-0002', 'processing', 39.99, 3.20, 5.99, 49.18,
 '{"full_name": "Jane Smith", "address_line1": "456 Oak Avenue", "city": "Los Angeles", "state": "CA", "postal_code": "90210", "country": "US", "phone": "+1234567892"}',
 'paypal', 'completed', NULL),
('550e8400-e29b-41d4-a716-446655440003', 'ORD-20241201-0003', 'shipped', 149.99, 12.00, 8.99, 170.98,
 '{"full_name": "Mike Johnson", "address_line1": "789 Pine Road", "address_line2": "Suite 200", "city": "Chicago", "state": "IL", "postal_code": "60601", "country": "US", "phone": "+1234567893"}',
 'credit_card', 'completed', 'Fragile item'),
('550e8400-e29b-41d4-a716-446655440004', 'ORD-20241201-0004', 'pending', 89.99, 7.20, 9.99, 107.18,
 '{"full_name": "Sarah Wilson", "address_line1": "321 Elm Street", "city": "Houston", "state": "TX", "postal_code": "77001", "country": "US", "phone": "+1234567894"}',
 'credit_card', 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440005', 'ORD-20241201-0005', 'delivered', 299.99, 24.00, 12.99, 336.98,
 '{"full_name": "David Brown", "address_line1": "654 Maple Drive", "address_line2": "Unit 15", "city": "Phoenix", "state": "AZ", "postal_code": "85001", "country": "US", "phone": "+1234567895"}',
 'credit_card', 'completed', 'Gift wrapping requested'),
('550e8400-e29b-41d4-a716-446655440006', 'ORD-20241201-0006', 'shipped', 34.99, 2.80, 7.99, 45.78,
 '{"full_name": "Lisa Davis", "address_line1": "987 Cedar Lane", "city": "Philadelphia", "state": "PA", "postal_code": "19101", "country": "US", "phone": "+1234567896"}',
 'paypal', 'completed', NULL),
('550e8400-e29b-41d4-a716-446655440007', 'ORD-20241201-0007', 'processing', 29.99, 2.40, 4.99, 37.38,
 '{"full_name": "Chris Miller", "address_line1": "147 Birch Boulevard", "address_line2": "Floor 3", "city": "San Antonio", "state": "TX", "postal_code": "78201", "country": "US", "phone": "+1234567897"}',
 'credit_card', 'completed', NULL),
('550e8400-e29b-41d4-a716-446655440008', 'ORD-20241201-0008', 'delivered', 59.99, 4.80, 7.99, 72.78,
 '{"full_name": "Amy Garcia", "address_line1": "258 Spruce Street", "city": "San Diego", "state": "CA", "postal_code": "92101", "country": "US", "phone": "+1234567898"}',
 'credit_card', 'completed', 'Call before delivery'),
('550e8400-e29b-41d4-a716-446655440009', 'ORD-20241201-0009', 'pending', 49.99, 4.00, 4.99, 58.98,
 '{"full_name": "Tom Anderson", "address_line1": "369 Willow Way", "address_line2": "Apt 2C", "city": "Dallas", "state": "TX", "postal_code": "75201", "country": "US", "phone": "+1234567899"}',
 'paypal', 'pending', NULL),
('550e8400-e29b-41d4-a716-446655440001', 'ORD-20241201-0010', 'shipped', 119.99, 9.60, 11.99, 141.58,
 '{"full_name": "John Doe", "address_line1": "555 Business Blvd", "address_line2": "Office 100", "city": "New York", "state": "NY", "postal_code": "10002", "country": "US", "phone": "+1234567891"}',
 'credit_card', 'completed', 'Business delivery');

-- Insert sample order items (3 order items)
-- NOTE: Order items require corresponding orders and users in auth.users table first.
-- Uncomment the following INSERT after creating users in auth.users with matching UUIDs and inserting orders.
INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, size, color, price) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-20241201-0001'), (SELECT id FROM products WHERE slug = 'classic-cotton-t-shirt'),
 'Classic Cotton T-Shirt', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 2, 'M', 'Black', 19.99),
((SELECT id FROM orders WHERE order_number = 'ORD-20241201-0001'), (SELECT id FROM products WHERE slug = 'slim-fit-jeans'),
 'Slim Fit Jeans', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 1, '32', 'Dark Blue', 59.99),
((SELECT id FROM orders WHERE order_number = 'ORD-20241201-0002'), (SELECT id FROM products WHERE slug = 'womens-summer-dress'),
 'Women''s Summer Dress', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 1, 'M', 'Floral', 39.99);

-- =====================================================
-- SAMPLE DATA INSERTION COMPLETE
-- =====================================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Sample Data Insertion Complete!';
  RAISE NOTICE 'Sample categories, products, profiles, addresses, cart items, orders, and order items inserted';
END $$;
