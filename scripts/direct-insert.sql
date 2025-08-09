-- VetConnect Direct Database Population
-- Copy and paste this entire script into your Supabase SQL Editor

-- Clear existing data (uncomment if needed)
-- DELETE FROM appointments;
-- DELETE FROM pets;
-- DELETE FROM veterinarians;
-- DELETE FROM profiles;
-- DELETE FROM clinics;

-- Insert Clinics
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

-- Insert sample profiles with mock UUIDs
INSERT INTO profiles (id, name, email, phone, user_type) VALUES 
('11111111-1111-1111-1111-111111111111', 'John Smith', 'john@example.com', '+1-555-0101', 'pet-owner'),
('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah@example.com', '+1-555-0102', 'pet-owner'),
('33333333-3333-3333-3333-333333333333', 'Mike Wilson', 'mike@example.com', '+1-555-0103', 'pet-owner'),
('44444444-4444-4444-4444-444444444444', 'Dr. Sarah Johnson', 'dr.smith@happypaws.com', '+1-555-0201', 'veterinarian'),
('55555555-5555-5555-5555-555555555555', 'Dr. Michael Chen', 'dr.chen@petcare.com', '+1-555-0202', 'veterinarian'),
('66666666-6666-6666-6666-666666666666', 'Dr. Emily Rodriguez', 'dr.rodriguez@gganimalhospital.com', '+1-555-0203', 'veterinarian');

-- Insert veterinarians
INSERT INTO veterinarians (id, specialties, experience, rating, review_count, clinic_id) VALUES 
('44444444-4444-4444-4444-444444444444', ARRAY['General Practice', 'Internal Medicine', 'Preventive Care'], 8, 4.8, 127, 'clinic-1'),
('55555555-5555-5555-5555-555555555555', ARRAY['Emergency Medicine', 'Critical Care', 'Trauma Surgery'], 12, 4.9, 89, 'clinic-2'),
('66666666-6666-6666-6666-666666666666', ARRAY['Cardiology', 'Internal Medicine', 'Geriatric Care'], 15, 4.9, 203, 'clinic-3');

-- Insert pets
INSERT INTO pets (name, species, breed, age, weight, gender, photo_url, medical_history, owner_id) VALUES 
('Buddy', 'dog', 'Golden Retriever', 3, 30.5, 'male', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Regular checkups'], '11111111-1111-1111-1111-111111111111'),
('Whiskers', 'cat', 'Siamese', 2, 4.2, 'female', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed'], '22222222-2222-2222-2222-222222222222'),
('Max', 'dog', 'German Shepherd', 5, 35.0, 'male', 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Hip dysplasia monitoring'], '33333333-3333-3333-3333-333333333333'),
('Luna', 'cat', 'Persian', 1, 3.8, 'female', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated'], '11111111-1111-1111-1111-111111111111'),
('Rocky', 'dog', 'Labrador', 4, 28.0, 'male', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Dental cleaning'], '22222222-2222-2222-2222-222222222222'),
('Mittens', 'cat', 'Maine Coon', 6, 5.5, 'female', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed', 'Senior care'], '33333333-3333-3333-3333-333333333333');

-- Verify the data insertion
SELECT 'Data inserted successfully!' as status;
SELECT 'Clinics: ' || COUNT(*) FROM clinics
UNION ALL
SELECT 'Profiles: ' || COUNT(*) FROM profiles  
UNION ALL
SELECT 'Veterinarians: ' || COUNT(*) FROM veterinarians
UNION ALL
SELECT 'Pets: ' || COUNT(*) FROM pets;

-- Show sample data
SELECT 'Sample clinics:' as info;
SELECT name, city, rating FROM clinics LIMIT 3;

SELECT 'Sample veterinarians:' as info;
SELECT p.name, v.specialties[1] as main_specialty, c.name as clinic_name 
FROM veterinarians v 
JOIN profiles p ON v.id = p.id 
JOIN clinics c ON v.clinic_id = c.id;

SELECT 'Sample pets:' as info;
SELECT p.name, p.species, p.breed, pr.name as owner_name 
FROM pets p 
JOIN profiles pr ON p.owner_id = pr.id 
ORDER BY p.name;