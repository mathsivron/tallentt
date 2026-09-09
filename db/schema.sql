-- Auth-only slice of the TalentWorld schema.
-- Other tables from the full SRD (orbits, hats, hat_media, escrows, leak_attempts)
-- are intentionally not created yet — this is authentication only.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gives us gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- added for real auth; not present in the original SRD schema
  role TEXT NOT NULL CHECK (role IN ('talent', 'client', 'dual')) DEFAULT 'dual',
  country TEXT NOT NULL,
  lga TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
