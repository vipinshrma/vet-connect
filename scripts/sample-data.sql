-- VetConnect Sample Data Migration Script
-- Run this in your Supabase SQL Editor

-- First, let's insert some sample clinics
INSERT INTO clinics (id, name, address, city, state, zip_code, phone, email, website, latitude, longitude, services, hours, rating, review_count) VALUES 
('clinic-1', 'Happy Paws Veterinary Clinic', '123 Pet Street', 'San Francisco', 'CA', '94102', '+1-555-0301', 'info@happypaws.com', 'https://happypaws.com', 37.7749, -122.4194, 
 ARRAY['General Practice', 'Vaccinations', 'Surgery', 'Dental Care'],
 '{"monday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "thursday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "friday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}, "sunday": {"is_open": false}}',
 4.8, 127),

('clinic-2', 'Emergency Pet Care Center', '456 Rescue Avenue', 'San Francisco', 'CA', '94105', '+1-555-0302', 'emergency@petcare.com', 'https://emergencypetcare.com', 37.7849, -122.4094,
 ARRAY['Emergency Medicine', 'Critical Care', '24/7 Service', 'Trauma Surgery'],
 '{"monday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "tuesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "wednesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "thursday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "friday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "saturday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "sunday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}}',
 4.9, 89),

('clinic-3', 'Golden Gate Animal Hospital', '789 Health Way', 'San Francisco', 'CA', '94110', '+1-555-0303', 'care@gganimalhospital.com', 'https://gganimalhospital.com', 37.7599, -122.4148,
 ARRAY['Cardiology', 'Internal Medicine', 'Geriatric Care', 'Oncology'],
 '{"monday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"}, "tuesday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"}, "wednesday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"}, "thursday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"}, "friday": {"is_open": true, "open_time": "07:00", "close_time": "20:00"}, "saturday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "sunday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}}',
 4.9, 203);

-- Note: For user profiles and pets, you'll need to create users through Supabase Auth first
-- Here are the sample login credentials to create manually in Supabase Auth:

/*
SAMPLE LOGIN CREDENTIALS TO CREATE IN SUPABASE AUTH:

Pet Owners:
1. Email: john@example.com, Password: password123, Name: John Smith, Phone: +1-555-0101
2. Email: sarah@example.com, Password: password123, Name: Sarah Johnson, Phone: +1-555-0102  
3. Email: mike@example.com, Password: password123, Name: Mike Wilson, Phone: +1-555-0103

Veterinarians:
1. Email: dr.smith@happypaws.com, Password: vetpass123, Name: Dr. Sarah Johnson, Phone: +1-555-0201
2. Email: dr.chen@petcare.com, Password: vetpass123, Name: Dr. Michael Chen, Phone: +1-555-0202
3. Email: dr.rodriguez@gganimalhospital.com, Password: vetpass123, Name: Dr. Emily Rodriguez, Phone: +1-555-0203

After creating these users in Supabase Auth, run the following SQL to create their profiles:
*/

-- Sample profiles (replace UUIDs with actual user IDs from Supabase Auth)
-- You'll get these UUIDs after creating the users in Supabase Auth

-- INSERT INTO profiles (id, name, email, phone, user_type) VALUES 
-- ('user-uuid-1', 'John Smith', 'john@example.com', '+1-555-0101', 'pet-owner'),
-- ('user-uuid-2', 'Sarah Johnson', 'sarah@example.com', '+1-555-0102', 'pet-owner'),
-- ('user-uuid-3', 'Mike Wilson', 'mike@example.com', '+1-555-0103', 'pet-owner'),
-- ('vet-uuid-1', 'Dr. Sarah Johnson', 'dr.smith@happypaws.com', '+1-555-0201', 'veterinarian'),
-- ('vet-uuid-2', 'Dr. Michael Chen', 'dr.chen@petcare.com', '+1-555-0202', 'veterinarian'),
-- ('vet-uuid-3', 'Dr. Emily Rodriguez', 'dr.rodriguez@gganimalhospital.com', '+1-555-0203', 'veterinarian');

-- Sample veterinarians (replace with actual vet user IDs)
-- INSERT INTO veterinarians (id, specialties, experience, rating, review_count, clinic_id) VALUES 
-- ('vet-uuid-1', ARRAY['General Practice', 'Internal Medicine', 'Preventive Care'], 8, 4.8, 127, 'clinic-1'),
-- ('vet-uuid-2', ARRAY['Emergency Medicine', 'Critical Care', 'Trauma Surgery'], 12, 4.9, 89, 'clinic-2'),
-- ('vet-uuid-3', ARRAY['Cardiology', 'Internal Medicine', 'Geriatric Care'], 15, 4.9, 203, 'clinic-3');

-- Sample pets (replace with actual owner user IDs)
-- INSERT INTO pets (name, species, breed, age, weight, gender, photo_url, medical_history, owner_id) VALUES 
-- ('Buddy', 'dog', 'Golden Retriever', 3, 30.5, 'male', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Regular checkups'], 'user-uuid-1'),
-- ('Whiskers', 'cat', 'Siamese', 2, 4.2, 'female', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed'], 'user-uuid-2'),
-- ('Max', 'dog', 'German Shepherd', 5, 35.0, 'male', 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Hip dysplasia monitoring'], 'user-uuid-3'),
-- ('Luna', 'cat', 'Persian', 1, 3.8, 'female', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated'], 'user-uuid-1');

-- Verify the data
SELECT 'Clinics' as table_name, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles  
UNION ALL
SELECT 'Veterinarians' as table_name, COUNT(*) as count FROM veterinarians
UNION ALL
SELECT 'Pets' as table_name, COUNT(*) as count FROM pets;