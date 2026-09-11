-- ChombuTar full schema v5.0
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('talent', 'client', 'dual')) DEFAULT 'dual',
  country TEXT,
  lga TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  phone TEXT,
  nin_hash TEXT,
  nin_last4 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
-- One NIN can only ever back one account. Partial index so multiple
-- users with no NIN on file don't collide on NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nin_hash ON users (nin_hash) WHERE nin_hash IS NOT NULL;

-- Hats Category taxonomy — 14 MECE categories, open-ended (custom entries
-- get inserted here too, same as the predefined 14, so they're
-- searchable/reusable across future hats). NOT the Orbit score — that's
-- hats.orbit_score, a computed confidence metric, unrelated to this table.
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hat_title TEXT NOT NULL, -- "Client seeking …" / "Talent seeking …" phrase
  username TEXT NOT NULL,
  verified_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  category TEXT NOT NULL, -- Hats Category (14 MECE taxonomy, custom allowed)
  skills TEXT[],
  hat_type TEXT CHECK (hat_type IN ('Full-time','Part-time','Freelance','Contract','One-Off')) DEFAULT 'Freelance',
  delivery_mode TEXT CHECK (delivery_mode IN ('Physical','Remote','Hybrid')),
  country TEXT,
  country_flag TEXT,
  currency TEXT DEFAULT 'NGN',
  lga TEXT,
  motto TEXT CHECK (char_length(motto) <= 80),
  -- Pricing: price_type picks which fields are live.
  --   fixed → rate + rate_unit (+ rate_unit_custom when rate_unit='custom')
  --   range → price_min + price_max (+ price_negotiable)
  price_type TEXT CHECK (price_type IN ('fixed','range')) DEFAULT 'fixed',
  price_min INT,
  price_max INT,
  price_negotiable BOOLEAN DEFAULT false,
  rate INT,
  rate_unit TEXT CHECK (rate_unit IN ('hr','day','week','month','year','custom')),
  rate_unit_custom TEXT,
  active BOOLEAN DEFAULT true,
  availability BOOLEAN DEFAULT true,
  available_from TIME, -- e.g. 15:00 — start of daily availability window
  available_to TIME,   -- e.g. 17:00 — end of daily availability window
  role TEXT CHECK (role IN ('talent','client','dual')) DEFAULT 'talent',
  rating DECIMAL DEFAULT 0,
  bookings INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  orbit_score INT DEFAULT 0, -- computed confidence score (see api/_lib/orbitScore.js) — NOT the category
  jobs_posted INT DEFAULT 0,
  spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hats_user ON hats (user_id);
CREATE INDEX IF NOT EXISTS idx_hats_category ON hats (category);
CREATE INDEX IF NOT EXISTS idx_hats_role ON hats (role);
CREATE INDEX IF NOT EXISTS idx_hats_active ON hats (active);

CREATE TABLE IF NOT EXISTS hat_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hat_id UUID REFERENCES hats(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('image','video','audio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hat_media_hat ON hat_media (hat_id);

CREATE TABLE IF NOT EXISTS escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hat_id UUID REFERENCES hats(id),
  client_id UUID REFERENCES users(id),
  talent_id UUID REFERENCES users(id),
  amount INT NOT NULL,
  status TEXT CHECK (status IN ('not_funded','secured','released','cancelled')) DEFAULT 'not_funded',
  contacts_unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leak_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT,
  masked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 14 MECE Hats Categories (open taxonomy — custom entries also
-- get inserted here at hat-creation time, see api/categories/index.js).
INSERT INTO categories (name) VALUES
  ('Beauty & Grooming'),
  ('Fashion & Styling'),
  ('Photography & Videography'),
  ('Music & Audio'),
  ('Performing Arts & Entertainment'),
  ('Visual Arts, Design & Crafts'),
  ('Modeling & Acting'),
  ('Food & Catering'),
  ('Events & Hospitality'),
  ('Health, Wellness & Fitness'),
  ('Home Services & Skilled Trades'),
  ('Tech & Digital Services'),
  ('Business, Admin & Professional Services'),
  ('Education & Training')
ON CONFLICT (name) DO NOTHING;

