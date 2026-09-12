-- Adds an optional caption to individual hat_media items — used by the
-- Showroom "Add" flow (pick a card -> pick media -> caption it).
-- Safe to run multiple times.
ALTER TABLE hat_media ADD COLUMN IF NOT EXISTS caption TEXT;
