-- Adds a daily availability time window to hats (e.g. "3pm – 5pm").
-- Safe to run multiple times.
ALTER TABLE hats ADD COLUMN IF NOT EXISTS available_from TIME;
ALTER TABLE hats ADD COLUMN IF NOT EXISTS available_to TIME;
