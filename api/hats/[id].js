import { query } from '../_lib/db.js'
import { getSessionUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody, isVerifiedName } from '../_lib/http.js'

async function getHat(id) {
  const { rows } = await query(
    `SELECT h.*, u.full_name as owner_name, u.avatar_url as owner_avatar
     FROM hats h LEFT JOIN users u ON u.id = h.user_id WHERE h.id = $1`,
    [id],
  )
  if (!rows[0]) return null
  const { rows: media } = await query(
    `SELECT id, hat_id, url, public_id, type FROM hat_media WHERE hat_id = $1`,
    [id],
  )
  return { ...rows[0], media }
}

export default async function handler(req, res) {
  const id = req.query?.id || (req.url.match(/\/api\/hats\/([^/?]+)/) || [])[1]
  if (!id) return json(res, 400, { error: 'Missing id' })

  if (req.method === 'GET') {
    try {
      const hat = await getHat(id)
      if (!hat) return json(res, 404, { error: 'Hat not found' })
      return json(res, 200, { hat })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: 'Failed to fetch hat' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const session = getSessionUser(req)
      if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

      const existing = await getHat(id)
      if (!existing) return json(res, 404, { error: 'Hat not found' })
      if (existing.user_id !== session.sub) return json(res, 403, { error: 'Forbidden' })

      const body = await readBody(req)
      const verified = body.verified_name != null ? isVerifiedName(body.verified_name) : existing.is_verified

      const { rows } = await query(
        `UPDATE hats SET
          hat_title = COALESCE($1, hat_title),
          username = COALESCE($2, username),
          verified_name = COALESCE($3, verified_name),
          is_verified = $4,
          orbit = COALESCE($5, orbit),
          skills = COALESCE($6, skills),
          hat_type = COALESCE($7, hat_type),
          country = COALESCE($8, country),
          country_flag = COALESCE($9, country_flag),
          currency = COALESCE($10, currency),
          lga = COALESCE($11, lga),
          motto = COALESCE($12, motto),
          price_min = COALESCE($13, price_min),
          price_max = COALESCE($14, price_max),
          rate = COALESCE($15, rate),
          availability = COALESCE($16, availability),
          active = COALESCE($17, active),
          role = COALESCE($18, role)
        WHERE id = $19 RETURNING *`,
        [
          body.hat_title ?? null,
          body.username ?? null,
          body.verified_name ?? null,
          verified,
          body.orbit ?? null,
          body.skills ?? null,
          body.hat_type ?? null,
          body.country ?? null,
          body.country_flag ?? null,
          body.currency ?? null,
          body.lga ?? null,
          body.motto ?? null,
          body.price_min != null ? Number(body.price_min) : null,
          body.price_max != null ? Number(body.price_max) : null,
          body.rate != null ? Number(body.rate) : null,
          body.availability ?? null,
          body.active ?? null,
          body.role ?? null,
          id,
        ],
      )

      if (Array.isArray(body.media)) {
        await query(`DELETE FROM hat_media WHERE hat_id = $1`, [id])
        for (const m of body.media) {
          if (!m.url || !m.public_id) continue
          await query(
            `INSERT INTO hat_media (hat_id, url, public_id, type) VALUES ($1,$2,$3,$4)`,
            [id, m.url, m.public_id, m.type || 'image'],
          )
        }
      }

      const hat = await getHat(id)
      return json(res, 200, { hat })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: err.message || 'Failed to update hat' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const session = getSessionUser(req)
      if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })
      const existing = await getHat(id)
      if (!existing) return json(res, 404, { error: 'Hat not found' })
      if (existing.user_id !== session.sub) return json(res, 403, { error: 'Forbidden' })
      await query(`DELETE FROM hats WHERE id = $1`, [id])
      return json(res, 200, { ok: true })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: 'Failed to delete hat' })
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE'])
}
