-- Verify and fix VetConnect database schema
-- Run this in Supabase SQL Editor if you're getting ID constraint errors

-- Check if clinics table has the correct structure
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND table_schema = 'public';

-- If the clinics table doesn't have the correct id default, fix it:
-- (Only run this if the above query shows no default for the id column)

-- Drop the existing constraint and add the correct one
-- ALTER TABLE clinics ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- If the table doesn't exist or has issues, recreate it:
-- DROP TABLE IF EXISTS clinics CASCADE;

CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  latitude DECIMAL NOT NULL DEFAULT 0,
  longitude DECIMAL NOT NULL DEFAULT 0,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  hours JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on clinics table
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Create policy for clinics (allow all operations for authenticated users)
DROP POLICY IF EXISTS "Allow all operations for clinics" ON clinics;
CREATE POLICY "Allow all operations for clinics" ON clinics
  FOR ALL USING (auth.role() = 'authenticated');

-- Verify the fix worked
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND column_name = 'id'
AND table_schema = 'public';