-- Run this once against your existing database to switch role naming
-- from creator/employer to talent/client (matches the rest of the SRD,
-- where hats.role already used talent/client/dual).

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'talent' WHERE role = 'creator';
UPDATE users SET role = 'client' WHERE role = 'employer';

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('talent', 'client', 'dual'));
