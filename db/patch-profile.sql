-- Run this once against your existing database to add the editable-profile
-- fields (phone, and a hashed NIN) that schema.sql now defines for fresh
-- installs. Safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nin_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nin_last4 TEXT;

-- We never store the NIN itself — only a keyed hash (see api/_lib/auth.js)
-- plus the last 4 digits for display. One NIN can only back one account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nin_hash ON users (nin_hash) WHERE nin_hash IS NOT NULL;
