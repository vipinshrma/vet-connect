-- Pets table schema for Supabase
-- This file contains the SQL to create the pets table and related functions

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(20) NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
    breed VARCHAR(100),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 50),
    weight DECIMAL(5,2) CHECK (weight > 0),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    photo_url TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medical_history TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON pets(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own pets
CREATE POLICY "Users can view their own pets" ON pets
    FOR SELECT USING (auth.uid() = owner_id);

-- Users can insert their own pets
CREATE POLICY "Users can insert their own pets" ON pets
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own pets
CREATE POLICY "Users can update their own pets" ON pets
    FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own pets
CREATE POLICY "Users can delete their own pets" ON pets
    FOR DELETE USING (auth.uid() = owner_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for pet photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for pet photos bucket
CREATE POLICY "Users can upload pet photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Pet photos are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'pet-photos');

CREATE POLICY "Users can update their pet photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their pet photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'pet-photos' AND auth.role() = 'authenticated');

-- Optional: Create vaccinations table for future use
CREATE TABLE IF NOT EXISTS vaccinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    next_due DATE,
    veterinarian_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vaccinations
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(date);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON vaccinations(next_due);

-- Enable RLS for vaccinations
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vaccinations
-- Users can only see vaccinations for their own pets
CREATE POLICY "Users can view vaccinations for their pets" ON vaccinations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pets 
            WHERE pets.id = vaccinations.pet_id 
            AND pets.owner_id = auth.uid()
        )
    );

-- Users can insert vaccinations for their own pets
CREATE POLICY "Users can insert vaccinations for their pets" ON vaccinations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pets 
            WHERE pets.id = vaccinations.pet_id 
            AND pets.owner_id = auth.uid()
        )
    );

-- Users can update vaccinations for their own pets
CREATE POLICY "Users can update vaccinations for their pets" ON vaccinations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pets 
            WHERE pets.id = vaccinations.pet_id 
            AND pets.owner_id = auth.uid()
        )
    );

-- Users can delete vaccinations for their own pets
CREATE POLICY "Users can delete vaccinations for their pets" ON vaccinations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pets 
            WHERE pets.id = vaccinations.pet_id 
            AND pets.owner_id = auth.uid()
        )
    );

-- Create trigger for vaccinations updated_at
CREATE TRIGGER update_vaccinations_updated_at
    BEFORE UPDATE ON vaccinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();