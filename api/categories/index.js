import { query } from '../_lib/db.js'
import { getSessionUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody } from '../_lib/http.js'

// Hats Category — NOT the Orbit score (see api/_lib/orbitScore.js, which is
// a computed confidence metric). This is the open-ended, 14-MECE-seeded
// taxonomy a hat is filed under.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await query(`SELECT id, name, created_by, created_at FROM categories ORDER BY name`)
      return json(res, 200, { categories: rows })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: 'Failed to fetch categories' })
    }
  }

  if (req.method === 'POST') {
    try {
      const session = getSessionUser(req)
      if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })
      const body = await readBody(req)
      const name = (body.name || '').trim()
      if (!name || name.length < 2) return json(res, 400, { error: 'Category name required (min 2 chars)' })

      const { rows } = await query(
        `INSERT INTO categories (name, created_by) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [name, session.sub],
      )
      return json(res, 201, { category: rows[0] })
    } catch (err) {
      console.error(err)
      return json(res, 500, { error: err.message || 'Failed to create category' })
    }
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}
