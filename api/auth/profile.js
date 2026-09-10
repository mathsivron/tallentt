import { query } from '../_lib/db.js'
import { getSessionUser, hashNin, toPublicUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody } from '../_lib/http.js'

const MAX_BIO = 280

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

  const { fullName, bio, location, phone, country, lga, avatarUrl, nin } = body ?? {}

  if (fullName != null && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    return json(res, 400, { error: 'Full name must be at least 2 characters.' })
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

  try {
    const result = await query(
      `UPDATE users SET
         full_name  = COALESCE($1, full_name),
         bio        = COALESCE($2, bio),
         location   = COALESCE($3, location),
         phone      = COALESCE($4, phone),
         country    = COALESCE($5, country),
         lga        = COALESCE($6, lga),
         avatar_url = COALESCE($7, avatar_url),
         nin_hash   = COALESCE($8, nin_hash),
         nin_last4  = COALESCE($9, nin_last4)
       WHERE id = $10
       RETURNING id, full_name, username, email, role, country, lga,
                 avatar_url, bio, location, phone, nin_hash, nin_last4`,
      [
        fullName?.trim() ?? null,
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
    if (!row) return json(res, 404, { error: 'User not found' })
    return json(res, 200, { user: toPublicUser(row) })
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('nin')) {
      return json(res, 409, { error: 'This NIN is already linked to another account.' })
    }
    console.error('profile update error:', err)
    return json(res, 500, { error: 'Something went wrong updating your profile.' })
  }
}
