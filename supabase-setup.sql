-- VetConnect Supabase Database Setup
-- Run these SQL commands in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- This is usually enabled by default in Supabase

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('pet-owner', 'veterinarian')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pets table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
  breed TEXT,
  age INTEGER NOT NULL,
  weight DECIMAL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  photo_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medical_history TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clinics table
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  services TEXT[],
  photos TEXT[],
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create veterinarians table
CREATE TABLE veterinarians (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialties TEXT[],
  experience INTEGER NOT NULL,
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  prescription TEXT[],
  cost DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Pets policies
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet owners can view own pets" ON pets
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Pet owners can insert own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Pet owners can update own pets" ON pets
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Pet owners can delete own pets" ON pets
  FOR DELETE USING (auth.uid() = owner_id);

-- Clinics policies (public read)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clinics" ON clinics
  FOR SELECT USING (true);

-- Veterinarians policies (public read)
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view veterinarians" ON veterinarians
  FOR SELECT USING (true);

-- Appointments policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet owners can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Veterinarians can view their appointments" ON appointments
  FOR SELECT USING (auth.uid() = veterinarian_id);

CREATE POLICY "Pet owners can insert appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Pet owners can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Veterinarians can update their appointments" ON appointments
  FOR UPDATE USING (auth.uid() = veterinarian_id);

-- Reviews policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER veterinarians_updated_at
  BEFORE UPDATE ON veterinarians
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();