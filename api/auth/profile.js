import { getClient } from '../_lib/db.js'
import { getSessionUser, hashNin, toPublicUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody } from '../_lib/http.js'

const MAX_BIO = 280
const USERNAME_RE = /^[A-Za-z0-9._-]{3,30}$/
// Kept in sync with api/auth/username-check.js's RESERVED set.
const RESERVED_USERNAMES = new Set([
  'admin', 'talent', 'test', 'chombutar', 'talentworld', 'tworld', 'support', 'root',
])

export default async function handler(req, res) {
  if (req.method !== 'PUT') return methodNotAllowed(res, ['PUT'])

  const session = getSessionUser(req)
  if (!session?.sub) return json(res, 401, { error: 'Not signed in' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { error: 'Invalid request body' })
  }

  const { fullName, username, bio, location, phone, country, lga, avatarUrl, nin } = body ?? {}

  if (fullName != null && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    return json(res, 400, { error: 'Full name must be at least 2 characters.' })
  }

  let cleanUsername = null
  if (username != null) {
    cleanUsername = String(username).trim().replace(/^@/, '')
    if (!USERNAME_RE.test(cleanUsername)) {
      return json(res, 400, {
        error: 'Username must be 3-30 characters: letters, numbers, dots, dashes, underscores.',
      })
    }
    if (RESERVED_USERNAMES.has(cleanUsername.toLowerCase())) {
      return json(res, 400, { error: 'That username is reserved.' })
    }
  }

  if (bio != null && String(bio).length > MAX_BIO) {
    return json(res, 400, { error: `Bio must be ${MAX_BIO} characters or fewer.` })
  }
  if (avatarUrl != null && typeof avatarUrl !== 'string') {
    return json(res, 400, { error: 'Invalid avatar.' })
  }

  // NIN is optional per-request — only touched when the user actually
  // types a new one. The raw value is hashed here and never persisted or
  // logged in plaintext.
  let ninHash = null
  let ninLast4 = null
  if (nin != null && String(nin).trim() !== '') {
    try {
      const result = hashNin(nin)
      ninHash = result.hash
      ninLast4 = result.last4
    } catch (err) {
      return json(res, err.status || 400, { error: err.message })
    }
  }

  // Username lives on the user row, but hats keep a denormalized copy for
  // fast listing queries (see api/hats/index.js). When the username
  // changes, both need to move together, so this runs as a transaction —
  // a client is checked out just for this request rather than using the
  // shared single-connection pool.
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `UPDATE users SET
         full_name  = COALESCE($1, full_name),
         username   = COALESCE($2, username),
         bio        = COALESCE($3, bio),
         location   = COALESCE($4, location),
         phone      = COALESCE($5, phone),
         country    = COALESCE($6, country),
         lga        = COALESCE($7, lga),
         avatar_url = COALESCE($8, avatar_url),
         nin_hash   = COALESCE($9, nin_hash),
         nin_last4  = COALESCE($10, nin_last4)
       WHERE id = $11
       RETURNING id, full_name, username, email, role, country, lga,
                 avatar_url, bio, location, phone, nin_hash, nin_last4`,
      [
        fullName?.trim() ?? null,
        cleanUsername,
        bio ?? null,
        location ?? null,
        phone ?? null,
        country ?? null,
        lga ?? null,
        avatarUrl ?? null,
        ninHash,
        ninLast4,
        session.sub,
      ],
    )
    const row = result.rows[0]
    if (!row) {
      await client.query('ROLLBACK')
      return json(res, 404, { error: 'User not found' })
    }

    if (cleanUsername) {
      await client.query(`UPDATE hats SET username = $1 WHERE user_id = $2`, [cleanUsername, session.sub])
    }

    await client.query('COMMIT')
    return json(res, 200, { user: toPublicUser(row) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    if (err.code === '23505' && err.constraint?.includes('nin')) {
      return json(res, 409, { error: 'This NIN is already linked to another account.' })
    }
    if (err.code === '23505' && err.constraint?.includes('username')) {
      return json(res, 409, { error: 'That username is already taken.' })
    }
    console.error('profile update error:', err)
    return json(res, 500, { error: 'Something went wrong updating your profile.' })
  } finally {
    client.release()
  }
}
