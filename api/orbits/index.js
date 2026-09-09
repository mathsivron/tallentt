import { query } from '../_lib/db.js'
import { getSessionUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody } from '../_lib/http.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await query(`SELECT id, name, created_by, created_at FROM orbits ORDER BY name`)
      return json(res, 200, { orbits: rows })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: 'Failed to fetch orbits' })
    }
  }

  if (req.method === 'POST') {
    try {
      const session = getSessionUser(req)
      if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })
      const body = await readBody(req)
      const name = (body.name || '').trim()
      if (!name || name.length < 2) return json(res, 400, { error: 'Orbit name required (min 2 chars)' })

      const { rows } = await query(
        `INSERT INTO orbits (name, created_by) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [name, session.sub],
      )
      return json(res, 201, { orbit: rows[0] })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: err.message || 'Failed to create orbit' })
    }
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}
