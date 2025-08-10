-- VetConnect Schedule Management Database Schema
-- Run this SQL to create schedule management tables

-- Veterinarian schedules table - stores weekly recurring schedules
CREATE TABLE IF NOT EXISTS veterinarian_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, etc.
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  break_start_time TIME DEFAULT '12:00',
  break_end_time TIME DEFAULT '13:00',
  slot_duration INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique schedule per veterinarian per day
  UNIQUE(veterinarian_id, day_of_week)
);

-- Schedule exceptions table - for one-time schedule changes
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('unavailable', 'custom_hours', 'break_change')),
  start_time TIME,
  end_time TIME,
  break_start_time TIME,
  break_end_time TIME,
  slot_duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique exception per veterinarian per date
  UNIQUE(veterinarian_id, exception_date)
);

-- Time slots table - generated from schedules for specific dates
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE CASCADE NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  slot_type TEXT NOT NULL DEFAULT 'regular' CHECK (slot_type IN ('regular', 'break', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique slot per vet per date/time combination
  UNIQUE(veterinarian_id, slot_date, start_time)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vet_schedules_vet_day ON veterinarian_schedules(veterinarian_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_vet_date ON schedule_exceptions(veterinarian_id, exception_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_vet_date ON time_slots(veterinarian_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_available, is_booked) WHERE is_available = true AND is_booked = false;

-- Enable RLS on all tables
ALTER TABLE veterinarian_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for veterinarian_schedules
CREATE POLICY schedules_vet_access ON veterinarian_schedules
  FOR ALL USING (veterinarian_id = auth.uid());

CREATE POLICY schedules_clinic_access ON veterinarian_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM veterinarians v 
      JOIN clinic_managers cm ON v.clinic_id = cm.clinic_id
      WHERE v.id = veterinarian_schedules.veterinarian_id 
      AND cm.veterinarian_id = auth.uid()
    )
  );

-- RLS Policies for schedule_exceptions
CREATE POLICY exceptions_vet_access ON schedule_exceptions
  FOR ALL USING (veterinarian_id = auth.uid());

CREATE POLICY exceptions_clinic_access ON schedule_exceptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM veterinarians v 
      JOIN clinic_managers cm ON v.clinic_id = cm.clinic_id
      WHERE v.id = schedule_exceptions.veterinarian_id 
      AND cm.veterinarian_id = auth.uid()
    )
  );

-- RLS Policies for time_slots
CREATE POLICY slots_vet_access ON time_slots
  FOR ALL USING (veterinarian_id = auth.uid());

CREATE POLICY slots_public_read ON time_slots
  FOR SELECT USING (true); -- Anyone can read available slots for booking

-- Function to generate time slots for a date range based on schedule
CREATE OR REPLACE FUNCTION generate_time_slots(
  vet_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  current_date DATE := start_date;
  day_schedule RECORD;
  exception_record RECORD;
  current_time TIME;
  slot_end_time TIME;
  slot_duration INTERVAL;
  slots_created INTEGER := 0;
BEGIN
  -- Loop through each date in the range
  WHILE current_date <= end_date LOOP
    -- Get the day of week (0 = Sunday)
    DECLARE
      day_num INTEGER := EXTRACT(DOW FROM current_date);
    BEGIN
      -- Check if there's an exception for this date
      SELECT * INTO exception_record 
      FROM schedule_exceptions 
      WHERE veterinarian_id = vet_id AND exception_date = current_date;
      
      IF exception_record.exception_type = 'unavailable' THEN
        -- Skip this date entirely
        current_date := current_date + INTERVAL '1 day';
        CONTINUE;
      END IF;
      
      -- Get the regular schedule for this day
      SELECT * INTO day_schedule 
      FROM veterinarian_schedules 
      WHERE veterinarian_id = vet_id 
      AND day_of_week = day_num 
      AND is_active = true
      AND is_working = true;
      
      IF FOUND THEN
        -- Use exception data if available, otherwise use regular schedule
        current_time := COALESCE(exception_record.start_time, day_schedule.start_time);
        slot_duration := MAKE_INTERVAL(mins => COALESCE(exception_record.slot_duration, day_schedule.slot_duration));
        
        -- Generate slots until end of day
        WHILE current_time < COALESCE(exception_record.end_time, day_schedule.end_time) LOOP
          slot_end_time := current_time + slot_duration;
          
          -- Skip break time
          IF NOT (current_time >= COALESCE(exception_record.break_start_time, day_schedule.break_start_time) 
                 AND current_time < COALESCE(exception_record.break_end_time, day_schedule.break_end_time)) THEN
            
            -- Insert the time slot (ON CONFLICT DO NOTHING to avoid duplicates)
            INSERT INTO time_slots (
              veterinarian_id, 
              slot_date, 
              start_time, 
              end_time,
              is_available,
              slot_type
            ) VALUES (
              vet_id, 
              current_date, 
              current_time, 
              slot_end_time,
              true,
              'regular'
            ) ON CONFLICT (veterinarian_id, slot_date, start_time) DO NOTHING;
            
            slots_created := slots_created + 1;
          END IF;
          
          current_time := slot_end_time;
        END LOOP;
      END IF;
    END;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN slots_created;
END;
$$ LANGUAGE plpgsql;

-- Function to update slot availability when appointment is booked
CREATE OR REPLACE FUNCTION update_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Mark slot as booked when appointment is created/updated
    UPDATE time_slots 
    SET is_booked = true, 
        is_available = false,
        appointment_id = NEW.id
    WHERE veterinarian_id = NEW.veterinarian_id
    AND slot_date = NEW.date::DATE
    AND start_time = NEW.time_slot->>'startTime'::TIME;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Mark slot as available when appointment is deleted
    UPDATE time_slots 
    SET is_booked = false, 
        is_available = true,
        appointment_id = NULL
    WHERE appointment_id = OLD.id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update slot availability
CREATE TRIGGER appointment_slot_sync
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_slot_booking();

-- Create default schedule for existing veterinarians (Monday-Friday, 8AM-5PM)
INSERT INTO veterinarian_schedules (veterinarian_id, day_of_week, is_working, start_time, end_time, slot_duration)
SELECT 
  v.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  true,
  '08:00'::TIME,
  '17:00'::TIME,
  30
FROM veterinarians v
WHERE NOT EXISTS (
  SELECT 1 FROM veterinarian_schedules vs 
  WHERE vs.veterinarian_id = v.id
);

-- Generate time slots for next 30 days for all veterinarians
SELECT veterinarian_id, generate_time_slots(veterinarian_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days') as slots_created
FROM veterinarians;