-- VetConnect Database Population Script
-- Execute this step by step in your Supabase SQL Editor

-- Step 1: Clear existing data (optional - uncomment if needed)
-- DELETE FROM appointments;
-- DELETE FROM pets;
-- DELETE FROM veterinarians;
-- DELETE FROM profiles;
-- DELETE FROM clinics;

-- Step 2: Insert Clinics
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
 4.9, 203),

('clinic-4', 'Mission District Veterinary', '321 Mission Street', 'San Francisco', 'CA', '94103', '+1-555-0304', 'info@missionvet.com', 'https://missionvet.com', 37.7849, -122.4194,
 ARRAY['Surgery', 'Orthopedics', 'Sports Medicine'],
 '{"monday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "thursday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "friday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}, "sunday": {"is_open": false}}',
 4.7, 142),

('clinic-5', 'Richmond Veterinary Hospital', '654 Richmond Boulevard', 'San Francisco', 'CA', '94118', '+1-555-0305', 'care@richmondvet.com', 'https://richmondvet.com', 37.7849, -122.4594,
 ARRAY['Dermatology', 'Allergology', 'Exotic Animals'],
 '{"monday": {"is_open": true, "open_time": "09:00", "close_time": "18:00"}, "tuesday": {"is_open": true, "open_time": "09:00", "close_time": "18:00"}, "wednesday": {"is_open": true, "open_time": "09:00", "close_time": "18:00"}, "thursday": {"is_open": true, "open_time": "09:00", "close_time": "18:00"}, "friday": {"is_open": true, "open_time": "09:00", "close_time": "18:00"}, "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}, "sunday": {"is_open": false}}',
 4.8, 76);

-- Step 3: Create sample user profiles
-- Note: These will use mock UUIDs. In production, you'd get these from Supabase Auth
INSERT INTO profiles (id, name, email, phone, user_type) VALUES 
('11111111-1111-1111-1111-111111111111', 'John Smith', 'john@example.com', '+1-555-0101', 'pet-owner'),
('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah@example.com', '+1-555-0102', 'pet-owner'),
('33333333-3333-3333-3333-333333333333', 'Mike Wilson', 'mike@example.com', '+1-555-0103', 'pet-owner'),
('44444444-4444-4444-4444-444444444444', 'Dr. Sarah Johnson', 'dr.smith@happypaws.com', '+1-555-0201', 'veterinarian'),
('55555555-5555-5555-5555-555555555555', 'Dr. Michael Chen', 'dr.chen@petcare.com', '+1-555-0202', 'veterinarian'),
('66666666-6666-6666-6666-666666666666', 'Dr. Emily Rodriguez', 'dr.rodriguez@gganimalhospital.com', '+1-555-0203', 'veterinarian'),
('77777777-7777-7777-7777-777777777777', 'Dr. James Park', 'dr.park@missionvet.com', '+1-555-0204', 'veterinarian'),
('88888888-8888-8888-8888-888888888888', 'Dr. Lisa Thompson', 'dr.thompson@richmondvet.com', '+1-555-0205', 'veterinarian');

-- Step 4: Create veterinarian records
INSERT INTO veterinarians (id, specialties, experience, rating, review_count, clinic_id) VALUES 
('44444444-4444-4444-4444-444444444444', ARRAY['General Practice', 'Internal Medicine', 'Preventive Care'], 8, 4.8, 127, 'clinic-1'),
('55555555-5555-5555-5555-555555555555', ARRAY['Emergency Medicine', 'Critical Care', 'Trauma Surgery'], 12, 4.9, 89, 'clinic-2'),
('66666666-6666-6666-6666-666666666666', ARRAY['Cardiology', 'Internal Medicine', 'Geriatric Care'], 15, 4.9, 203, 'clinic-3'),
('77777777-7777-7777-7777-777777777777', ARRAY['Surgery', 'Orthopedics', 'Sports Medicine'], 10, 4.7, 142, 'clinic-4'),
('88888888-8888-8888-8888-888888888888', ARRAY['Dermatology', 'Allergology', 'Exotic Animals'], 9, 4.8, 76, 'clinic-5');

-- Step 5: Create sample pets
INSERT INTO pets (name, species, breed, age, weight, gender, photo_url, medical_history, owner_id) VALUES 
('Buddy', 'dog', 'Golden Retriever', 3, 30.5, 'male', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Regular checkups'], '11111111-1111-1111-1111-111111111111'),
('Whiskers', 'cat', 'Siamese', 2, 4.2, 'female', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed'], '22222222-2222-2222-2222-222222222222'),
('Max', 'dog', 'German Shepherd', 5, 35.0, 'male', 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Hip dysplasia monitoring'], '33333333-3333-3333-3333-333333333333'),
('Luna', 'cat', 'Persian', 1, 3.8, 'female', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated'], '11111111-1111-1111-1111-111111111111'),
('Rocky', 'dog', 'Labrador', 4, 28.0, 'male', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Dental cleaning'], '22222222-2222-2222-2222-222222222222'),
('Mittens', 'cat', 'Maine Coon', 6, 5.5, 'female', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed', 'Senior care'], '33333333-3333-3333-3333-333333333333'),
('Charlie', 'dog', 'Beagle', 2, 12.0, 'male', 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Puppy shots'], '11111111-1111-1111-1111-111111111111'),
('Shadow', 'cat', 'British Shorthair', 3, 4.8, 'male', 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered'], '22222222-2222-2222-2222-222222222222');

-- Step 6: Create sample appointments (past and upcoming)
INSERT INTO appointments (pet_id, veterinarian_id, clinic_id, owner_id, appointment_date, start_time, end_time, reason, status, notes) VALUES 
-- Past appointments
((SELECT id FROM pets WHERE name = 'Buddy'), '44444444-4444-4444-4444-444444444444', 'clinic-1', '11111111-1111-1111-1111-111111111111', '2024-01-15', '10:00', '10:30', 'Annual checkup', 'completed', 'Healthy dog, all vaccines up to date'),
((SELECT id FROM pets WHERE name = 'Whiskers'), '55555555-5555-5555-5555-555555555555', 'clinic-2', '22222222-2222-2222-2222-222222222222', '2024-01-20', '14:00', '14:30', 'Emergency visit', 'completed', 'Treated for minor injury, prescribed antibiotics'),
((SELECT id FROM pets WHERE name = 'Max'), '66666666-6666-6666-6666-666666666666', 'clinic-3', '33333333-3333-3333-3333-333333333333', '2024-02-01', '09:00', '09:30', 'Heart checkup', 'completed', 'Cardiology exam, heart sounds normal'),

-- Upcoming appointments
((SELECT id FROM pets WHERE name = 'Luna'), '44444444-4444-4444-4444-444444444444', 'clinic-1', '11111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '3 days', '11:00', '11:30', 'Vaccination', 'scheduled', NULL),
((SELECT id FROM pets WHERE name = 'Rocky'), '77777777-7777-7777-7777-777777777777', 'clinic-4', '22222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '5 days', '15:00', '15:30', 'Surgery consultation', 'scheduled', NULL),
((SELECT id FROM pets WHERE name = 'Mittens'), '88888888-8888-8888-8888-888888888888', 'clinic-5', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '7 days', '10:00', '10:30', 'Skin examination', 'scheduled', NULL);

-- Step 7: Create sample reviews
INSERT INTO reviews (user_id, veterinarian_id, clinic_id, appointment_id, rating, comment) VALUES 
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'clinic-1', (SELECT id FROM appointments WHERE reason = 'Annual checkup' LIMIT 1), 5, 'Dr. Johnson was excellent with Buddy. Very thorough examination and great with explaining everything.'),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'clinic-2', (SELECT id FROM appointments WHERE reason = 'Emergency visit' LIMIT 1), 5, 'Quick response during emergency. Dr. Chen saved Whiskers life!'),
('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'clinic-3', (SELECT id FROM appointments WHERE reason = 'Heart checkup' LIMIT 1), 4, 'Professional service. Max is feeling much better after the treatment.');

-- Step 8: Verify the migration
SELECT 'Migration Results:' as status;
SELECT 'Clinics' as table_name, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles  
UNION ALL
SELECT 'Veterinarians' as table_name, COUNT(*) as count FROM veterinarians
UNION ALL
SELECT 'Pets' as table_name, COUNT(*) as count FROM pets
UNION ALL
SELECT 'Appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'Reviews' as table_name, COUNT(*) as count FROM reviews;

-- Step 9: Sample data verification queries
SELECT 'Sample Clinics:' as info;
SELECT name, city, rating, review_count FROM clinics LIMIT 3;

SELECT 'Sample Veterinarians:' as info;
SELECT p.name, v.specialties, v.experience, c.name as clinic_name 
FROM veterinarians v 
JOIN profiles p ON v.id = p.id 
JOIN clinics c ON v.clinic_id = c.id 
LIMIT 3;

SELECT 'Sample Pets:' as info;
SELECT p.name, p.species, p.breed, pr.name as owner_name 
FROM pets p 
JOIN profiles pr ON p.owner_id = pr.id 
LIMIT 3;

SELECT 'Sample Appointments:' as info;
SELECT pet.name as pet_name, vet.name as vet_name, a.appointment_date, a.reason, a.status
FROM appointments a
JOIN pets pet ON a.pet_id = pet.id
JOIN profiles vet ON a.veterinarian_id = vet.id
ORDER BY a.appointment_date DESC
LIMIT 3;