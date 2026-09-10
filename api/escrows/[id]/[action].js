import { query } from '../../_lib/db.js'
import { getSessionUser } from '../../_lib/auth.js'
import { json, methodNotAllowed } from '../../_lib/http.js'

// Handles both:
//   POST /api/escrows/:id/fund
//   POST /api/escrows/:id/release
// Merged into one function (via the [action] dynamic segment) to stay
// under Vercel's serverless function limit. Same behavior as the
// original fund.js / release.js files, just dispatched by req.query.action.
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const id = req.query?.id
  const action = req.query?.action
  if (!id) return json(res, 400, { error: 'Missing id' })

  if (action === 'fund') return fund(req, res, id)
  if (action === 'release') return release(req, res, id)
  return json(res, 404, { error: 'Unknown escrow action' })
}

async function fund(req, res, id) {
  try {
    const session = getSessionUser(req)
    if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

    const { rows } = await query(
      `UPDATE escrows SET status = 'secured', contacts_unlocked = true
       WHERE id = $1 AND client_id = $2 AND status = 'not_funded'
       RETURNING *`,
      [id, session.sub],
    )
    if (!rows[0]) return json(res, 404, { error: 'Escrow not found or already funded' })
    return json(res, 200, { escrow: rows[0] })
  } catch (err) {
    console.error(err)
    return json(res, 500, { error: 'Failed to fund escrow' })
  }
}

async function release(req, res, id) {
  try {
    const session = getSessionUser(req)
    if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

    const { rows } = await query(
      `UPDATE escrows SET status = 'released', released_at = NOW()
       WHERE id = $1 AND client_id = $2 AND status = 'secured'
       RETURNING *`,
      [id, session.sub],
    )
    if (!rows[0]) return json(res, 404, { error: 'Escrow not found or not secured' })
    return json(res, 200, { escrow: rows[0] })
  } catch (err) {
    console.error(err)
    return json(res, 500, { error: 'Failed to release escrow' })
  }
}
