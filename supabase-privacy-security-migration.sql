-- Migration: Add Privacy & Security Preferences to Profiles Table
-- Run this SQL in your Supabase SQL Editor
-- This adds privacy preference and security columns to the profiles table

-- Add privacy preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_profile_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_data_sharing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_location_sharing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_search_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS security_2fa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_biometric_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_deactivated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the columns
COMMENT ON COLUMN profiles.privacy_profile_visible IS 'Make profile visible to other users';
COMMENT ON COLUMN profiles.privacy_data_sharing IS 'Allow data sharing for analytics';
COMMENT ON COLUMN profiles.privacy_location_sharing IS 'Allow location sharing for services';
COMMENT ON COLUMN profiles.privacy_search_visible IS 'Make profile searchable by other users';
COMMENT ON COLUMN profiles.security_2fa_enabled IS 'Two-factor authentication enabled';
COMMENT ON COLUMN profiles.security_biometric_enabled IS 'Biometric authentication enabled';
COMMENT ON COLUMN profiles.account_deactivated IS 'Account deactivation status';
COMMENT ON COLUMN profiles.account_deactivated_at IS 'Timestamp when account was deactivated';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_visible 
ON profiles(privacy_profile_visible) 
WHERE privacy_profile_visible = true;

CREATE INDEX IF NOT EXISTS idx_profiles_account_deactivated 
ON profiles(account_deactivated) 
WHERE account_deactivated = true;

-- Update existing rows to have default values
UPDATE profiles
SET 
  privacy_profile_visible = COALESCE(privacy_profile_visible, true),
  privacy_data_sharing = COALESCE(privacy_data_sharing, false),
  privacy_location_sharing = COALESCE(privacy_location_sharing, true),
  privacy_search_visible = COALESCE(privacy_search_visible, true),
  security_2fa_enabled = COALESCE(security_2fa_enabled, false),
  security_biometric_enabled = COALESCE(security_biometric_enabled, false),
  account_deactivated = COALESCE(account_deactivated, false)
WHERE 
  privacy_profile_visible IS NULL 
  OR privacy_data_sharing IS NULL 
  OR privacy_location_sharing IS NULL 
  OR privacy_search_visible IS NULL
  OR security_2fa_enabled IS NULL
  OR security_biometric_enabled IS NULL
  OR account_deactivated IS NULL;

-- Create security_activity_log table
CREATE TABLE IF NOT EXISTS security_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'password_changed',
    'password_reset',
    'login',
    'logout',
    '2fa_enabled',
    '2fa_disabled',
    'biometric_enabled',
    'biometric_disabled',
    'account_deactivated',
    'account_deleted',
    'account_reactivated',
    'email_changed',
    'phone_changed',
    'privacy_setting_changed',
    'session_terminated'
  )),
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security_activity_log
CREATE INDEX IF NOT EXISTS idx_security_activity_user_id 
ON security_activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_activity_type 
ON security_activity_log(activity_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE security_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_activity_log
CREATE POLICY "Users can view own security activity" ON security_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security activity" ON security_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND (column_name LIKE 'privacy_%' OR column_name LIKE 'security_%' OR column_name LIKE 'account_%')
ORDER BY column_name;

-- Verify security_activity_log table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'security_activity_log'
ORDER BY ordinal_position;

