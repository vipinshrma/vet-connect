-- Populate VetConnect Database with Sample Veterinarian Data
-- Run this SQL script after running supabase-setup.sql

-- First, let's insert some sample clinics
INSERT INTO clinics (id, name, address, city, state, zip_code, phone, email, website, latitude, longitude, services, rating, review_count) VALUES
('clinic-1', 'Happy Paws Veterinary Clinic', '123 Main St', 'San Francisco', 'CA', '94102', '(415) 555-0123', 'info@happypaws.com', 'www.happypaws.com', 37.7749, -122.4194, '{"General Practice", "Emergency Care", "Surgery", "Dental Care"}', 4.8, 150),
('clinic-2', 'Pet Care Emergency Center', '456 Market St', 'San Francisco', 'CA', '94105', '(415) 555-0456', 'emergency@petcare.com', 'www.petcareemergency.com', 37.7849, -122.4094, '{"Emergency Medicine", "Critical Care", "Trauma Surgery", "24/7 Care"}', 4.9, 89),
('clinic-3', 'Golden Gate Animal Hospital', '789 Union St', 'San Francisco', 'CA', '94133', '(415) 555-0789', 'contact@gganimalhospital.com', 'www.gganimalhospital.com', 37.7949, -122.3994, '{"Cardiology", "Internal Medicine", "Oncology", "Geriatric Care"}', 4.9, 203),
('clinic-4', 'Mission Veterinary Clinic', '321 Mission St', 'San Francisco', 'CA', '94110', '(415) 555-0345', 'info@missionvet.com', 'www.missionvet.com', 37.7649, -122.4294, '{"Surgery", "Orthopedics", "Sports Medicine", "Rehabilitation"}', 4.7, 142),
('clinic-5', 'Richmond Animal Hospital', '654 Geary Blvd', 'San Francisco', 'CA', '94118', '(415) 555-0987', 'contact@richmondvet.com', 'www.richmondvet.com', 37.7849, -122.4594, '{"Dermatology", "Allergology", "Exotic Animals", "Ophthalmology"}', 4.8, 118),
('clinic-6', 'Sunset Animal Care', '987 Irving St', 'San Francisco', 'CA', '94122', '(415) 555-0654', 'info@sunsetanimal.com', 'www.sunsetanimal.com', 37.7549, -122.4694, '{"General Practice", "Dental Care", "Wellness Programs", "Exotic Animals"}', 4.6, 98),
('clinic-7', 'SOMA Pet Hospital', '147 2nd St', 'San Francisco', 'CA', '94105', '(415) 555-0234', 'emergency@somapet.com', 'www.somapet.com', 37.7899, -122.3994, '{"Emergency Medicine", "Urgent Care", "Toxicology", "Critical Care"}', 4.7, 134),
('clinic-8', 'Presidio Veterinary Center', '258 Lombard St', 'San Francisco', 'CA', '94123', '(415) 555-0876', 'info@presidiovet.com', 'www.presidiovet.com', 37.8049, -122.4194, '{"Behavioral Medicine", "Alternative Medicine", "Physical Therapy", "Holistic Care"}', 4.8, 167);

-- Now insert sample profiles for veterinarians
-- Note: In a real application, these would be created when veterinarians sign up
INSERT INTO profiles (id, name, email, phone, user_type, photo_url) VALUES
('vet-1', 'Dr. Sarah Johnson', 'sarah.johnson@happypaws.com', '(415) 555-0123', 'veterinarian', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'),
('vet-2', 'Dr. Michael Chen', 'michael.chen@petcare.com', '(415) 555-0456', 'veterinarian', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face'),
('vet-3', 'Dr. Emily Rodriguez', 'emily.rodriguez@gganimalhospital.com', '(415) 555-0789', 'veterinarian', 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face'),
('vet-4', 'Dr. James Park', 'james.park@missionvet.com', '(415) 555-0345', 'veterinarian', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face'),
('vet-5', 'Dr. Lisa Thompson', 'lisa.thompson@richmondvet.com', '(415) 555-0987', 'veterinarian', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'),
('vet-6', 'Dr. Robert Kim', 'robert.kim@sunsetanimal.com', '(415) 555-0654', 'veterinarian', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face'),
('vet-7', 'Dr. Amanda Foster', 'amanda.foster@somapet.com', '(415) 555-0234', 'veterinarian', 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face'),
('vet-8', 'Dr. David Martinez', 'david.martinez@presidiovet.com', '(415) 555-0876', 'veterinarian', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face'),
('vet-9', 'Dr. Jennifer Lee', 'jennifer.lee@happypaws.com', '(415) 555-0135', 'veterinarian', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'),
('vet-10', 'Dr. Christopher Brown', 'chris.brown@gganimalhospital.com', '(415) 555-0791', 'veterinarian', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face'),
('vet-11', 'Dr. Maria Gonzalez', 'maria.gonzalez@richmondvet.com', '(415) 555-0988', 'veterinarian', 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face'),
('vet-12', 'Dr. Kevin Zhang', 'kevin.zhang@petcare.com', '(415) 555-0457', 'veterinarian', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face'),
('vet-13', 'Dr. Rachel White', 'rachel.white@missionvet.com', '(415) 555-0346', 'veterinarian', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'),
('vet-14', 'Dr. Thomas Wilson', 'thomas.wilson@sunsetanimal.com', '(415) 555-0655', 'veterinarian', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face'),
('vet-15', 'Dr. Nicole Davis', 'nicole.davis@presidiovet.com', '(415) 555-0877', 'veterinarian', 'https://images.unsplash.com/photo-1594824389199-e48b8b40b2d4?w=400&h=400&fit=crop&crop=face');

-- Now insert the veterinarian records
INSERT INTO veterinarians (id, specialties, experience, rating, review_count, clinic_id) VALUES
('vet-1', '{"General Practice", "Internal Medicine", "Preventive Care"}', 8, 4.8, 127, 'clinic-1'),
('vet-2', '{"Emergency Medicine", "Critical Care", "Trauma Surgery"}', 12, 4.9, 89, 'clinic-2'),
('vet-3', '{"Cardiology", "Internal Medicine", "Geriatric Care"}', 15, 4.9, 203, 'clinic-3'),
('vet-4', '{"Surgery", "Orthopedics", "Sports Medicine"}', 10, 4.7, 142, 'clinic-4'),
('vet-5', '{"Dermatology", "Allergology", "Exotic Animals"}', 9, 4.8, 76, 'clinic-5'),
('vet-6', '{"General Practice", "Dental Care", "Wellness Programs"}', 6, 4.5, 98, 'clinic-6'),
('vet-7', '{"Emergency Medicine", "Urgent Care", "Toxicology"}', 11, 4.7, 134, 'clinic-7'),
('vet-8', '{"Behavioral Medicine", "Alternative Medicine", "Holistic Care"}', 13, 4.8, 167, 'clinic-8'),
('vet-9', '{"Pediatric Care", "Vaccinations", "Nutrition"}', 7, 4.6, 92, 'clinic-1'),
('vet-10', '{"Oncology", "Chemotherapy", "Pain Management"}', 16, 4.9, 145, 'clinic-3'),
('vet-11', '{"Ophthalmology", "Vision Care", "Eye Surgery"}', 14, 4.8, 118, 'clinic-5'),
('vet-12', '{"Emergency Surgery", "Trauma Care", "Intensive Care"}', 9, 4.7, 156, 'clinic-2'),
('vet-13', '{"Reproductive Medicine", "Breeding Consulting", "Neonatal Care"}', 8, 4.6, 87, 'clinic-4'),
('vet-14', '{"Exotic Animals", "Avian Medicine", "Reptile Care"}', 12, 4.9, 94, 'clinic-6'),
('vet-15', '{"Physical Therapy", "Rehabilitation", "Sports Medicine"}', 10, 4.7, 123, 'clinic-8');

-- Add sample reviews to make the data more realistic
INSERT INTO reviews (user_id, veterinarian_id, clinic_id, rating, comment) VALUES
-- We'll use placeholder user IDs for now - in a real app these would be actual user IDs
('user-1', 'vet-1', 'clinic-1', 5, 'Dr. Johnson was amazing with my dog. Very thorough and caring.'),
('user-2', 'vet-1', 'clinic-1', 5, 'Excellent service and very knowledgeable staff.'),
('user-3', 'vet-2', 'clinic-2', 5, 'Dr. Chen saved my cat during an emergency. Highly recommend!'),
('user-4', 'vet-2', 'clinic-2', 4, 'Great emergency care, though the wait was a bit long.'),
('user-5', 'vet-3', 'clinic-3', 5, 'Dr. Rodriguez is the best cardiologist in the city.'),
('user-6', 'vet-4', 'clinic-4', 5, 'Perfect surgery results. My dog is running again!'),
('user-7', 'vet-5', 'clinic-5', 5, 'Finally found someone who knows exotic animals well.'),
('user-8', 'vet-6', 'clinic-6', 4, 'Good general practice vet, reasonably priced.'),
('user-9', 'vet-7', 'clinic-7', 5, 'Quick response during pet emergency.'),
('user-10', 'vet-8', 'clinic-8', 5, 'Holistic approach really helped my anxious dog.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_veterinarians_clinic_id ON veterinarians(clinic_id);
CREATE INDEX IF NOT EXISTS idx_veterinarians_specialties ON veterinarians USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_veterinarians_rating ON veterinarians(rating DESC);
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reviews_veterinarian_id ON reviews(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id ON reviews(clinic_id);

-- Add full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_clinics_name_search ON clinics USING gin(to_tsvector('english', name));

-- Update profile table to allow public read for veterinarians (needed for the join)
CREATE POLICY "Anyone can view veterinarian profiles" ON profiles
  FOR SELECT USING (user_type = 'veterinarian');