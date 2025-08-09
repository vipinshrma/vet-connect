# VetConnect Data Migration Guide

This guide will help you populate your Supabase database with sample data for testing the VetConnect app.

## Option 1: Automated Migration Script

### Prerequisites
1. Get your Supabase Service Role Key:
   - Go to your Supabase Dashboard
   - Navigate to Settings > API
   - Copy the **service_role** key (not the anon key)

### Steps
1. Open `scripts/migrateData.js`
2. Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE` with your actual service role key
3. Run the migration:
   ```bash
   npm run migrate-data
   ```

## Option 2: Manual Migration (Recommended for beginners)

### Step 1: Insert Clinics (SQL)
Run this in your Supabase SQL Editor:

```sql
INSERT INTO clinics (id, name, address, city, state, zip_code, phone, email, website, latitude, longitude, services, hours, rating, review_count) VALUES 
('clinic-1', 'Happy Paws Veterinary Clinic', '123 Pet Street', 'San Francisco', 'CA', '94102', '+1-555-0301', 'info@happypaws.com', 'https://happypaws.com', 37.7749, -122.4194, 
 ARRAY['General Practice', 'Vaccinations', 'Surgery', 'Dental Care'],
 '{"monday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "thursday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "friday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"}, "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"}, "sunday": {"is_open": false}}',
 4.8, 127),

('clinic-2', 'Emergency Pet Care Center', '456 Rescue Avenue', 'San Francisco', 'CA', '94105', '+1-555-0302', 'emergency@petcare.com', 'https://emergencypetcare.com', 37.7849, -122.4094,
 ARRAY['Emergency Medicine', 'Critical Care', '24/7 Service', 'Trauma Surgery'],
 '{"monday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "tuesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "wednesday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "thursday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "friday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "saturday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}, "sunday": {"is_open": true, "open_time": "00:00", "close_time": "23:59"}}',
 4.9, 89);
```

### Step 2: Create User Accounts
Go to Supabase Dashboard > Authentication > Users > Invite User

**Pet Owners:**
- Email: `john@example.com`, Password: `password123`
- Email: `sarah@example.com`, Password: `password123`  
- Email: `mike@example.com`, Password: `password123`

**Veterinarians:**
- Email: `dr.smith@happypaws.com`, Password: `vetpass123`
- Email: `dr.chen@petcare.com`, Password: `vetpass123`

### Step 3: Create User Profiles
After creating the users, get their UUIDs from the Authentication panel and run:

```sql
-- Replace the UUIDs with actual user IDs from Supabase Auth
INSERT INTO profiles (id, name, email, phone, user_type) VALUES 
('john-user-uuid', 'John Smith', 'john@example.com', '+1-555-0101', 'pet-owner'),
('sarah-user-uuid', 'Sarah Johnson', 'sarah@example.com', '+1-555-0102', 'pet-owner'),
('mike-user-uuid', 'Mike Wilson', 'mike@example.com', '+1-555-0103', 'pet-owner'),
('dr-smith-uuid', 'Dr. Sarah Johnson', 'dr.smith@happypaws.com', '+1-555-0201', 'veterinarian'),
('dr-chen-uuid', 'Dr. Michael Chen', 'dr.chen@petcare.com', '+1-555-0202', 'veterinarian');
```

### Step 4: Create Veterinarian Records
```sql
-- Replace with actual vet user UUIDs
INSERT INTO veterinarians (id, specialties, experience, rating, review_count, clinic_id) VALUES 
('dr-smith-uuid', ARRAY['General Practice', 'Internal Medicine', 'Preventive Care'], 8, 4.8, 127, 'clinic-1'),
('dr-chen-uuid', ARRAY['Emergency Medicine', 'Critical Care', 'Trauma Surgery'], 12, 4.9, 89, 'clinic-2');
```

### Step 5: Create Sample Pets
```sql
-- Replace with actual owner UUIDs
INSERT INTO pets (name, species, breed, age, weight, gender, photo_url, medical_history, owner_id) VALUES 
('Buddy', 'dog', 'Golden Retriever', 3, 30.5, 'male', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Neutered', 'Regular checkups'], 'john-user-uuid'),
('Whiskers', 'cat', 'Siamese', 2, 4.2, 'female', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Spayed'], 'sarah-user-uuid'),
('Max', 'dog', 'German Shepherd', 5, 35.0, 'male', 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated', 'Hip dysplasia monitoring'], 'mike-user-uuid'),
('Luna', 'cat', 'Persian', 1, 3.8, 'female', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop&crop=face', ARRAY['Vaccinated'], 'john-user-uuid');
```

## Test Login Credentials

After migration, you can test the app with these credentials:

### Pet Owners:
- **Email:** john@example.com **Password:** password123
- **Email:** sarah@example.com **Password:** password123
- **Email:** mike@example.com **Password:** password123

### Veterinarians:
- **Email:** dr.smith@happypaws.com **Password:** vetpass123
- **Email:** dr.chen@petcare.com **Password:** vetpass123

## Verification

Run this query to verify your data:

```sql
SELECT 'Clinics' as table_name, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles  
UNION ALL
SELECT 'Veterinarians' as table_name, COUNT(*) as count FROM veterinarians
UNION ALL
SELECT 'Pets' as table_name, COUNT(*) as count FROM pets;
```

Expected results:
- Clinics: 2
- Profiles: 5  
- Veterinarians: 2
- Pets: 4

## Next Steps

1. Test login with the sample credentials
2. Browse veterinarians and clinics in the app
3. Book sample appointments
4. Add more data as needed for testing

## Troubleshooting

- **Authentication errors:** Make sure RLS policies are set up correctly
- **Missing data:** Check that all UUIDs match between users and related records
- **Permission errors:** Verify your service role key has proper permissions