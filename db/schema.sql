-- ChombuTar full schema v4.0
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE TABLE IF NOT EXISTS orbits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hat_title TEXT NOT NULL,
  username TEXT NOT NULL,
  verified_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  orbit TEXT NOT NULL,
  skills TEXT[],
  hat_type TEXT CHECK (hat_type IN ('Freelance','Contract','Full-time')),
  country TEXT,
  country_flag TEXT,
  currency TEXT DEFAULT 'NGN',
  lga TEXT,
  motto TEXT CHECK (char_length(motto) <= 80),
  price_min INT NOT NULL DEFAULT 0,
  price_max INT,
  rate INT,
  active BOOLEAN DEFAULT true,
  availability BOOLEAN DEFAULT true,
  role TEXT CHECK (role IN ('talent','client','dual')) DEFAULT 'talent',
  rating DECIMAL DEFAULT 0,
  bookings INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  orbit_score INT DEFAULT 0,
  jobs_posted INT DEFAULT 0,
  spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hats_user ON hats (user_id);
CREATE INDEX IF NOT EXISTS idx_hats_orbit ON hats (orbit);
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

-- Seed default orbits
INSERT INTO orbits (name) VALUES
  ('Music & Audio'),
  ('Visual Arts & Design'),
  ('Performing Arts'),
  ('Community & Care'),
  ('Beauty'),
  ('Event Buyer'),
  ('Models'),
  ('Actors'),
  ('Musicians'),
  ('Creators'),
  ('Developers')
ON CONFLICT (name) DO NOTHING;
