-- VetConnect Quick Migration Script
-- Copy and paste these sections one by one into your Supabase SQL Editor

-- Step 1: Insert Sample Clinics
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

-- Verify clinics were created
SELECT 'Clinics created: ' || COUNT(*) as result FROM clinics;