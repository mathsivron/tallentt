import { query } from '../_lib/db.js'
import { getSessionUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody } from '../_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const session = getSessionUser(req)
    if (!session?.sub) return json(res, 401, { error: 'Unauthorized' })

    const body = await readBody(req)
    const { hat_id, talent_id } = body
    if (!hat_id) return json(res, 400, { error: 'hat_id required' })

    const { rows: hatRows } = await query(
      `SELECT id, user_id, price_type, rate, price_min FROM hats WHERE id = $1`,
      [hat_id],
    )
    if (!hatRows[0]) return json(res, 404, { error: 'Hat not found' })
    const hat = hatRows[0]
    // Fixed pricing escrows the flat rate; range pricing escrows the floor
    // of the range (the client can always fund more once agreed).
    const amount = hat.price_type === 'range' ? hat.price_min : hat.rate
    if (!amount) return json(res, 400, { error: 'This hat has no price set yet.' })
    const talent = talent_id || hat.user_id

    const { rows } = await query(
      `INSERT INTO escrows (hat_id, client_id, talent_id, amount, status, contacts_unlocked)
       VALUES ($1, $2, $3, $4, 'not_funded', false) RETURNING *`,
      [hat_id, session.sub, talent, amount],
    )
    return json(res, 201, { escrow: rows[0] })
  } catch (err) {
    console.error(err)
    return json(res, 500, { error: err.message || 'Failed to create escrow' })
  }
}
