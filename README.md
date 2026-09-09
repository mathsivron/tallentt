# TalentWorld — Authentication slice

This is the **authentication-only** build-out of TalentWorld: real accounts,
hashed passwords, and signed sessions — replacing the old static demo page
that faked login with `localStorage`.

Nothing past sign-in exists yet (no Hats, Showroom, or escrow). That's
intentional — this was scoped to auth first.

## What's here

```
src/
  pages/AuthPage.jsx       Sign in / role select / account details / success
  pages/Dashboard.jsx      Placeholder page once you're signed in
  context/AuthContext.jsx  Holds the current user, talks to the API
  lib/api.js               fetch wrapper (sends the session cookie)
api/
  auth/register.js         POST — create account, hash password, start session
  auth/login.js            POST — verify password, start session
  auth/logout.js           POST — clear session
  auth/me.js               GET  — who am I (used on page load)
  _lib/db.js               Postgres connection (Neon)
  _lib/auth.js             bcrypt hashing, JWT sign/verify, cookie helpers
db/
  schema.sql               users table (adds password_hash — not in the original SRD)
  migrate.js                run schema.sql against DATABASE_URL
  patch-roles.sql           one-off patch if your DB still has the old creator/employer roles
```

Roles are `talent`, `client`, or `dual` (not creator/employer). If you ran the
schema before this change, apply `db/patch-roles.sql` once against your
database to rename existing rows and update the constraint.

Signup now shows a **signup policy popup** (Agree / Disagree) after the
account-details form validates and before the account is actually created.
Disagreeing cancels the signup and returns to the form.

Sessions are a JWT in an `httpOnly` cookie (`tw_session`), so the frontend
never touches the token directly — it just calls the API with
`credentials: 'include'`.

## 1. Set up Neon Postgres

1. Create a project at [neon.tech](https://neon.tech) (or use your existing one).
2. Copy the **pooled** connection string (Dashboard → Connection Details →
   check "Pooled connection").
3. Run the schema against it:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   ```
   This creates the `users` table (id, full_name, username, email,
   password_hash, role, country, lga, created_at).

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=<your Neon pooled connection string>
JWT_SECRET=<a long random string>
```

Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add both of these in **Vercel → Project → Settings → Environment
Variables** too before deploying.

## 3. Install and run locally

```bash
npm install
```

The frontend (`npm run dev`) is served by Vite, but `/api/*` routes are
Vercel serverless functions — Vite's dev server doesn't run those. Use the
Vercel CLI for a full local stack:

```bash
npm install -g vercel   # one-time
vercel dev
```

`vercel dev` serves both the Vite frontend and the `/api` functions
together, reading `.env` automatically.

## 4. Deploy

```bash
vercel --prod
```

(or connect the repo in the Vercel dashboard — `vercel.json` already points
`buildCommand` at `npm run build` and `outputDirectory` at `dist`, with a
rewrite so client-side routing works.)

## How the pieces fit together

- **Register** (`POST /api/auth/register`): validates input, hashes the
  password with bcrypt, inserts the user, signs a JWT, sets it as an
  `httpOnly` cookie, returns the public user fields.
- **Login** (`POST /api/auth/login`): looks up by email, compares the
  password with bcrypt, signs a session cookie the same way. Wrong email and
  wrong password return the same generic error so you can't enumerate which
  emails have accounts.
- **Me** (`GET /api/auth/me`): reads the cookie, verifies the JWT, re-fetches
  the user from the DB. `AuthContext` calls this once on load so a page
  refresh doesn't lose your session.
- **Logout** (`POST /api/auth/logout`): clears the cookie.
- `ProtectedRoute` / `PublicOnlyRoute` in `App.jsx` redirect based on whether
  `AuthContext` has a user, once the initial `/me` check finishes.

## What's deliberately not done yet

- No password reset / forgot-password flow (the UI has a stub button).
- No "Continue with Google" (button exists, not wired up).
- No email verification.
- No rate limiting on login attempts.
- Every other TalentWorld feature (Hats, Showroom, escrow, orbits, anti-leak
  chat masking) — next slices, not part of this one.

## Original full-product spec

The complete multi-feature prompt (Hats, escrow, Cloudinary uploads, PWA,
etc.) is preserved in `srd` for reference when you're ready to build the
next slice.
