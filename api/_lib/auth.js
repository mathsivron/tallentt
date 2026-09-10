import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'cw_session'
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it in Vercel → Settings → Environment Variables.')
  }
  return secret
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signSession(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: SEVEN_DAYS_SECONDS })
}

export function verifySession(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((pair) => {
      const idx = pair.indexOf('=')
      const key = decodeURIComponent(pair.slice(0, idx).trim())
      const value = decodeURIComponent(pair.slice(idx + 1).trim())
      return [key, value]
    }),
  )
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SEVEN_DAYS_SECONDS}`,
  ]
  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function getSessionUser(req) {
  const cookies = parseCookies(req)
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  return verifySession(token)
}

// Shape the public-safe user object returned to the frontend — never send
// password_hash back to the client.
export function toPublicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    role: row.role,
    country: row.country,
    lga: row.lga,
  }
}
