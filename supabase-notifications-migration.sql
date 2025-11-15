-- Migration: Add Notification Preferences to Profiles Table
-- Run this SQL in your Supabase SQL Editor
-- This adds notification preference columns to the profiles table

-- Add notification preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_push_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_appointment_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_marketing_emails BOOLEAN DEFAULT false;

-- Add comment to document the columns
COMMENT ON COLUMN profiles.notification_push_enabled IS 'Enable/disable push notifications for the user';
COMMENT ON COLUMN profiles.notification_email_enabled IS 'Enable/disable email notifications for the user';
COMMENT ON COLUMN profiles.notification_appointment_reminders IS 'Enable/disable appointment reminder notifications';
COMMENT ON COLUMN profiles.notification_marketing_emails IS 'Enable/disable marketing/promotional emails';

-- Create index for faster queries (optional, but recommended if you'll filter by notification preferences)
CREATE INDEX IF NOT EXISTS idx_profiles_notification_push ON profiles(notification_push_enabled) WHERE notification_push_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_notification_email ON profiles(notification_email_enabled) WHERE notification_email_enabled = true;

-- Update existing rows to have default values (in case there are existing profiles)
UPDATE profiles
SET 
  notification_push_enabled = COALESCE(notification_push_enabled, true),
  notification_email_enabled = COALESCE(notification_email_enabled, true),
  notification_appointment_reminders = COALESCE(notification_appointment_reminders, true),
  notification_marketing_emails = COALESCE(notification_marketing_emails, false)
WHERE 
  notification_push_enabled IS NULL 
  OR notification_email_enabled IS NULL 
  OR notification_appointment_reminders IS NULL 
  OR notification_marketing_emails IS NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name LIKE 'notification_%'
ORDER BY column_name;

