-- Add new DNA dimensions to mp_profiles and profiles tables

-- mp_profiles
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS urban_rural_score FLOAT DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS international_national_score FLOAT DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS security_score FLOAT DEFAULT 0;

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS urban_rural_score FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS international_national_score FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_score FLOAT DEFAULT 0;

