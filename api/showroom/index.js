import { query } from '../_lib/db.js'
import { json, methodNotAllowed } from '../_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  try {
    const { rows: hats } = await query(
      `SELECT h.*, u.avatar_url as owner_avatar
       FROM hats h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE h.active = true AND h.role = 'talent'
       ORDER BY (h.bookings + h.orbit_score + h.likes) DESC
       LIMIT 12`,
    )
    const ids = hats.map((h) => h.id)
    let mediaByHat = {}
    if (ids.length) {
      const { rows: media } = await query(
        `SELECT id, hat_id, url, public_id, type FROM hat_media WHERE hat_id = ANY($1::uuid[])`,
        [ids],
      )
      for (const m of media) {
        if (!mediaByHat[m.hat_id]) mediaByHat[m.hat_id] = []
        mediaByHat[m.hat_id].push(m)
      }
    }
    const curated = hats.map((h, i) => ({
      ...h,
      media: mediaByHat[h.id] || [],
      isHost: i === 0,
    }))

    const { rows: categories } = await query(`SELECT id, name FROM categories ORDER BY name`)
    return json(res, 200, { hats: curated, categories })
  } catch (err) {
    console.error(err)
    return json(res, 500, { error: 'Failed to load showroom' })
  }
}
