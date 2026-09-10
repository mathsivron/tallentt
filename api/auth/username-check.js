import { query } from '../_lib/db.js'
import { json, methodNotAllowed } from '../_lib/http.js'

const RESERVED = new Set(['admin', 'talent', 'test', 'tworld', 'talentworld', 'support', 'root'])

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const raw = (url.searchParams.get('u') || '').trim().replace(/^@/, '')
    if (!raw) return json(res, 400, { status: 'invalid', message: 'Username required' })

    if (!/^[A-Za-z0-9._-]{3,30}$/.test(raw)) {
      return json(res, 200, { status: 'invalid', message: '3–30 chars: letters, numbers, . _ -' })
    }

    if (RESERVED.has(raw.toLowerCase())) {
      return json(res, 200, { status: 'taken', message: 'Reserved username' })
    }

    const { rows } = await query(
      `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [raw],
    )
    if (rows.length) return json(res, 200, { status: 'taken', message: 'Taken' })
    return json(res, 200, { status: 'available', message: 'Available' })
  } catch (err) {
    console.error(err)
    return json(res, 500, { status: 'error', message: 'Check failed' })
  }
}
