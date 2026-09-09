import { query } from '../_lib/db.js'
import { getSessionUser, toPublicUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody, isVerifiedName } from '../_lib/http.js'

async function attachMedia(hats) {
  if (!hats.length) return hats
  const ids = hats.map((h) => h.id)
  const { rows } = await query(
    `SELECT id, hat_id, url, public_id, type FROM hat_media WHERE hat_id = ANY($1::uuid[])`,
    [ids],
  )
  const byHat = {}
  for (const m of rows) {
    if (!byHat[m.hat_id]) byHat[m.hat_id] = []
    byHat[m.hat_id].push(m)
  }
  return hats.map((h) => ({ ...h, media: byHat[h.id] || [] }))
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const role = url.searchParams.get('role') // talent | client
      const orbit = url.searchParams.get('orbit')
      const lga = url.searchParams.get('lga')
      const search = url.searchParams.get('search')
      const available = url.searchParams.get('available')
      const userId = url.searchParams.get('user_id')

      const clauses = ['h.active = true']
      const params = []
      let i = 1

      if (userId) {
        clauses.push(`h.user_id = $${i++}`)
        params.push(userId)
      }
      if (role && (role === 'talent' || role === 'client')) {
        clauses.push(`h.role = $${i++}`)
        params.push(role)
      }
      if (orbit) {
        clauses.push(`h.orbit = $${i++}`)
        params.push(orbit)
      }
      if (lga) {
        clauses.push(`h.lga ILIKE $${i++}`)
        params.push(`%${lga}%`)
      }
      if (available === 'true') {
        clauses.push('h.availability = true')
      }
      if (search) {
        clauses.push(`(h.username ILIKE $${i} OR h.hat_title ILIKE $${i} OR $${i} = ANY(h.skills))`)
        params.push(`%${search}%`)
        i++
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
      const { rows } = await query(
        `SELECT h.*, u.full_name as owner_name, u.avatar_url as owner_avatar
         FROM hats h
         LEFT JOIN users u ON u.id = h.user_id
         ${where}
         ORDER BY (h.bookings + h.orbit_score + h.likes) DESC, h.created_at DESC
         LIMIT 100`,
        params,
      )
      const withMedia = await attachMedia(rows)
      return json(res, 200, { hats: withMedia })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: 'Failed to fetch hats' })
    }
  }

  if (req.method === 'POST') {
    try {
      const session = getSessionUser(req)
      if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

      const body = await readBody(req)
      const {
        hat_title,
        username,
        verified_name,
        orbit,
        skills = [],
        hat_type = 'Freelance',
        country,
        country_flag,
        currency = 'NGN',
        lga,
        motto,
        price_min,
        price_max,
        rate,
        role = 'talent',
        media = [],
        availability = true,
      } = body

      if (!hat_title || !username || !orbit || price_min == null) {
        return json(res, 400, { error: 'hat_title, username, orbit, and price_min are required' })
      }
      if (role === 'talent' && (!media || media.length === 0)) {
        return json(res, 400, { error: 'Portfolio file is required for Talent hats' })
      }

      const verified = isVerifiedName(verified_name)

      const { rows } = await query(
        `INSERT INTO hats (
          user_id, hat_title, username, verified_name, is_verified, orbit, skills,
          hat_type, country, country_flag, currency, lga, motto, price_min, price_max,
          rate, role, availability
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *`,
        [
          session.sub,
          hat_title,
          username,
          verified_name || null,
          verified,
          orbit,
          skills,
          hat_type,
          country || null,
          country_flag || null,
          currency,
          lga || null,
          motto || null,
          Number(price_min),
          price_max != null ? Number(price_max) : null,
          rate != null ? Number(rate) : null,
          role,
          availability,
        ],
      )
      const hat = rows[0]

      for (const m of media) {
        if (!m.url || !m.public_id) continue
        await query(
          `INSERT INTO hat_media (hat_id, url, public_id, type) VALUES ($1,$2,$3,$4)`,
          [hat.id, m.url, m.public_id, m.type || 'image'],
        )
      }

      const withMedia = await attachMedia([hat])
      return json(res, 201, { hat: withMedia[0] })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: err.message || 'Failed to create hat' })
    }
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}
