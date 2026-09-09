import { query } from '../../_lib/db.js'
import { getSessionUser } from '../../_lib/auth.js'
import { json, methodNotAllowed } from '../../_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const session = getSessionUser(req)
    if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

    const id = req.query?.id || (req.url.match(/\/api\/escrows\/([^/]+)\/fund/) || [])[1]
    if (!id) return json(res, 400, { error: 'Missing id' })

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
