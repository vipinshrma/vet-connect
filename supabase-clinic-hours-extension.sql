-- VetConnect Clinic Hours Extension
-- Run this SQL to add clinic hours support to existing clinics table

-- Add hours and additional clinic management fields  
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS hours JSONB DEFAULT '{
  "monday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
  "tuesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
  "wednesday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
  "thursday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
  "friday": {"is_open": true, "open_time": "08:00", "close_time": "18:00"},
  "saturday": {"is_open": true, "open_time": "09:00", "close_time": "17:00"},
  "sunday": {"is_open": false}
}';

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT ARRAY['cash', 'credit-card', 'debit-card']::TEXT[];

-- Remove specialities column if it exists (specialities are now computed from veterinarians)
ALTER TABLE clinics DROP COLUMN IF EXISTS specialities;

-- Add clinic management permissions (who can edit clinic info)
CREATE TABLE IF NOT EXISTS clinic_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'editor')),
  permissions JSONB DEFAULT '{
    "edit_profile": true,
    "edit_hours": true,
    "edit_services": true,
    "manage_staff": false
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique vet-clinic combinations
  UNIQUE(clinic_id, veterinarian_id)
);

-- Create RLS policies for clinic management
ALTER TABLE clinic_managers ENABLE ROW LEVEL SECURITY;

-- Policy: Veterinarians can view their own clinic management records
CREATE POLICY clinic_managers_view_own ON clinic_managers
  FOR SELECT USING (veterinarian_id = auth.uid());

-- Policy: Clinic owners can manage clinic_managers
CREATE POLICY clinic_managers_manage_by_owner ON clinic_managers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_managers cm
      WHERE cm.clinic_id = clinic_managers.clinic_id 
      AND cm.veterinarian_id = auth.uid() 
      AND cm.role = 'owner'
    )
  );

-- Policy: Veterinarians can update clinics they manage
CREATE POLICY clinics_update_by_managers ON clinics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clinic_managers cm
      WHERE cm.clinic_id = clinics.id 
      AND cm.veterinarian_id = auth.uid()
      AND (cm.permissions->>'edit_profile')::boolean = true
    )
  );

-- Sample data: Make veterinarians owners of their associated clinics
INSERT INTO clinic_managers (clinic_id, veterinarian_id, role, permissions)
SELECT DISTINCT v.clinic_id, v.id, 'owner', '{
  "edit_profile": true,
  "edit_hours": true, 
  "edit_services": true,
  "manage_staff": true
}'
FROM veterinarians v 
WHERE v.clinic_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM clinic_managers cm 
  WHERE cm.clinic_id = v.clinic_id 
  AND cm.veterinarian_id = v.id
);

-- Function to automatically create clinic ownership when vet joins clinic
CREATE OR REPLACE FUNCTION create_clinic_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinic_id IS NOT NULL AND OLD.clinic_id IS DISTINCT FROM NEW.clinic_id THEN
    INSERT INTO clinic_managers (clinic_id, veterinarian_id, role, permissions)
    VALUES (
      NEW.clinic_id, 
      NEW.id, 
      'manager',
      '{"edit_profile": true, "edit_hours": true, "edit_services": true, "manage_staff": false}'
    )
    ON CONFLICT (clinic_id, veterinarian_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create clinic management rights
CREATE TRIGGER veterinarians_clinic_ownership
  AFTER UPDATE OF clinic_id ON veterinarians
  FOR EACH ROW
  EXECUTE FUNCTION create_clinic_ownership();