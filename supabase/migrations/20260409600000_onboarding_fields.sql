-- Add onboarding-related fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
