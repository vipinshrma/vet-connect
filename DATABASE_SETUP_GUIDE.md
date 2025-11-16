# VetConnect Database Setup Guide

## 🚀 Complete Database Setup Process

Follow these steps to set up your Supabase database with schema and sample data:

### Step 1: Create Database Schema

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your VetConnect project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Schema Setup**
   - Copy the entire content from `supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to create all tables and policies

### Step 2: Populate with Sample Data

1. **In the same SQL Editor (or new query)**
   - Copy the entire content from `scripts/direct-insert.sql`
   - Paste it into the SQL Editor  
   - Click "Run" to insert sample data

### Step 3: Verify Database Setup

Run this verification query in SQL Editor:

```sql
-- Check all tables were created and populated
SELECT 
  'clinics' as table_name, 
  COUNT(*) as record_count 
FROM clinics
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles  
UNION ALL
SELECT 'veterinarians', COUNT(*) FROM veterinarians
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
```

Expected results after setup:
- ✅ clinics: 3+ records
- ✅ profiles: 6+ records  
- ✅ veterinarians: 3+ records
- ✅ pets: 6+ records
- ✅ appointments: 0 records (initially)
- ✅ reviews: 0 records (initially)

### Step 4: Create Authentication Users

⚠️ **IMPORTANT**: Passwords are stored in Supabase Auth (not profiles table)

1. **Go to Supabase Dashboard → Authentication → Users**
2. **Click "Add User" (not "Invite User" - we want to set passwords directly)**
3. **Create each test account with these exact credentials:**

**Pet Owners:**
- Email: `john@example.com`
- Password: `password123`
- Email Confirm: ✅ Check "Auto Confirm User"

- Email: `sarah@example.com`
- Password: `password123`
- Email Confirm: ✅ Check "Auto Confirm User"

- Email: `mike@example.com`
- Password: `password123`
- Email Confirm: ✅ Check "Auto Confirm User"

**Veterinarians:**
- Email: `dr.smith@happypaws.com`
- Password: `vetpass123`
- Email Confirm: ✅ Check "Auto Confirm User"

- Email: `dr.chen@petcare.com`
- Password: `vetpass123`
- Email Confirm: ✅ Check "Auto Confirm User"

- Email: `dr.rodriguez@gganimalhospital.com`
- Password: `vetpass123`
- Email Confirm: ✅ Check "Auto Confirm User"

**Note**: The profiles table contains user info, but passwords are securely handled by Supabase Auth system.

### Step 5: Update Profile UUIDs (Optional)

If you want the profiles to match the auth users:

1. **Get User UUIDs**
   - Go to Authentication → Users
   - Copy the UUID for each user

2. **Update Profile IDs**
   ```sql
   -- Example: Update John's profile with his actual auth UUID
   UPDATE profiles 
   SET id = 'actual-john-uuid-from-auth-panel'
   WHERE email = 'john@example.com';
   
   -- Repeat for other users...
   ```

### Step 6: Test Database Connection

Run the check script to verify everything works:

```bash
npm run check-database
```

Expected output:
```
📊 clinics: 3 records
📊 profiles: 6 records  
📊 veterinarians: 3 records
📊 pets: 6 records
✅ Sample clinic found: Happy Paws Veterinary Clinic
```

## 🎯 Sample Data Overview

After setup, you'll have:

### Clinics
- **Happy Paws Veterinary Clinic** - General practice (8am-6pm)
- **Emergency Pet Care Center** - 24/7 emergency care
- **Golden Gate Animal Hospital** - Cardiology & specialties

### Test Login Credentials
**Pet Owner:**
- hemantshrma801@gmail.com / Test@1234

**Veterinarian:**
- pakiko9332@fermiro.com / Test@1234

### Sample Pets
- **Buddy** (John's Golden Retriever)
- **Whiskers** (Sarah's Siamese Cat)  
- **Max** (Mike's German Shepherd)
- **Luna** (John's Persian Cat)
- **Rocky** (Sarah's Labrador)
- **Mittens** (Mike's Maine Coon)

## ✅ Troubleshooting

**"relation does not exist" errors:**
- Run the schema setup first (`supabase-setup.sql`)

**"row violates check constraint" errors:**
- Ensure user_type values are exactly 'pet-owner' or 'veterinarian'

**Authentication issues:**
- Create users in Supabase Auth panel first
- Ensure email addresses match between auth and profiles

**RLS policy errors:**
- Check that RLS policies are enabled
- Verify user UUIDs match between auth.users and profiles

## 🚀 Ready to Test!

Once complete, you can:
1. Start the React Native app: `npm start`
2. Login with any test account
3. Browse clinics and veterinarians
4. View and manage pets
5. Book appointments
6. Test all app features with real data!