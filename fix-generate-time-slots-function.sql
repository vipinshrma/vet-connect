-- Fix for generate_time_slots function
-- Run this in your Supabase SQL Editor to create/fix the function

-- Drop the function if it exists (to ensure clean recreation)
DROP FUNCTION IF EXISTS generate_time_slots(UUID, DATE, DATE);

-- Create the function with correct signature
CREATE OR REPLACE FUNCTION generate_time_slots(
  vet_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  loop_date DATE := start_date;
  day_schedule RECORD;
  exception_record RECORD;
  slot_time TIME;
  slot_end_time TIME;
  slot_duration INTERVAL;
  slots_created INTEGER := 0;
  day_num INTEGER;
BEGIN
  -- Loop through each date in the range
  WHILE loop_date <= end_date LOOP
    -- Get the day of week (0 = Sunday)
    day_num := EXTRACT(DOW FROM loop_date);
    
    -- Check if there's an exception for this date
    SELECT * INTO exception_record 
    FROM schedule_exceptions 
    WHERE veterinarian_id = vet_id AND exception_date = loop_date;
    
    -- If exception exists and type is unavailable, skip this date
    IF FOUND AND exception_record.exception_type = 'unavailable' THEN
      loop_date := loop_date + INTERVAL '1 day';
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
      slot_time := COALESCE(exception_record.start_time, day_schedule.start_time);
      slot_duration := MAKE_INTERVAL(mins => COALESCE(exception_record.slot_duration, day_schedule.slot_duration));
      
      -- Generate slots until end of day
      WHILE slot_time < COALESCE(exception_record.end_time, day_schedule.end_time) LOOP
        slot_end_time := slot_time + slot_duration;
        
        -- Skip break time if break times exist
        IF (COALESCE(exception_record.break_start_time, day_schedule.break_start_time) IS NOT NULL 
            AND COALESCE(exception_record.break_end_time, day_schedule.break_end_time) IS NOT NULL) THEN
          IF NOT (slot_time >= COALESCE(exception_record.break_start_time, day_schedule.break_start_time) 
                 AND slot_time < COALESCE(exception_record.break_end_time, day_schedule.break_end_time)) THEN
            
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
              loop_date, 
              slot_time, 
              slot_end_time,
              true,
              'regular'
            ) ON CONFLICT (veterinarian_id, slot_date, start_time) DO NOTHING;
            
            slots_created := slots_created + 1;
          END IF;
        ELSE
          -- No break time, insert slot normally
          INSERT INTO time_slots (
            veterinarian_id, 
            slot_date, 
            start_time, 
            end_time,
            is_available,
            slot_type
          ) VALUES (
            vet_id, 
            loop_date, 
            slot_time, 
            slot_end_time,
            true,
            'regular'
          ) ON CONFLICT (veterinarian_id, slot_date, start_time) DO NOTHING;
          
          slots_created := slots_created + 1;
        END IF;
        
        slot_time := slot_end_time;
      END LOOP;
    END IF;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN slots_created;
END;
$$ LANGUAGE plpgsql;

