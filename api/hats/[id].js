import { query } from '../_lib/db.js'
import { getSessionUser } from '../_lib/auth.js'
import { json, methodNotAllowed, readBody, isVerifiedName } from '../_lib/http.js'
import { computeOrbitScore } from '../_lib/orbitScore.js'
import { HAT_TYPES, DELIVERY_MODES, normalizePricing } from '../_lib/hatFields.js'

async function getHat(id) {
  const { rows } = await query(
    `SELECT h.*, u.avatar_url as owner_avatar
     FROM hats h LEFT JOIN users u ON u.id = h.user_id WHERE h.id = $1`,
    [id],
  )
  if (!rows[0]) return null
  const { rows: media } = await query(
    `SELECT id, hat_id, url, public_id, type, caption FROM hat_media WHERE hat_id = $1`,
    [id],
  )
  return { ...rows[0], media, confidence: rows[0].orbit_score }
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
      // Never accept username from client on update — keep account username
      const verified =
        body.verified_name != null ? isVerifiedName(body.verified_name) : existing.is_verified

      if (body.hat_type != null && !HAT_TYPES.includes(body.hat_type)) {
        return json(res, 400, { error: 'Invalid hat type.' })
      }
      if (body.delivery_mode != null && !DELIVERY_MODES.includes(body.delivery_mode)) {
        return json(res, 400, { error: 'Invalid delivery mode.' })
      }

      // Pricing is only re-validated/re-normalized when the client actually
      // sent pricing fields this time — otherwise keep what's on file.
      const touchedPricing = ['price_type', 'rate', 'price_min', 'price_max'].some((k) => body[k] != null)
      let pricingFields = {
        price_type: existing.price_type,
        rate: existing.rate,
        rate_unit: existing.rate_unit,
        rate_unit_custom: existing.rate_unit_custom,
        price_min: existing.price_min,
        price_max: existing.price_max,
        price_negotiable: existing.price_negotiable,
      }
      if (touchedPricing) {
        const merged = { ...existing, ...body }
        const pricing = normalizePricing(merged)
        if (!pricing.ok) return json(res, 400, { error: pricing.error })
        pricingFields = pricing.fields
      }

      const nextSkills = body.skills ?? existing.skills ?? []
      const nextMotto = body.motto ?? existing.motto
      const nextAvail = body.availability != null ? body.availability : existing.availability

      let mediaCount = existing.media?.length || 0
      if (Array.isArray(body.media)) {
        await query(`DELETE FROM hat_media WHERE hat_id = $1`, [id])
        for (const m of body.media) {
          if (!m.url || !m.public_id) continue
          await query(
            `INSERT INTO hat_media (hat_id, url, public_id, type, caption) VALUES ($1,$2,$3,$4,$5)`,
            [id, m.url, m.public_id, m.type || 'image', m.caption || null],
          )
        }
        mediaCount = body.media.filter((m) => m.url && m.public_id).length
      }

      const orbitScore = computeOrbitScore({
        mediaCount,
        isVerified: verified,
        skillsCount: Array.isArray(nextSkills) ? nextSkills.length : 0,
        hasMotto: Boolean(nextMotto && String(nextMotto).trim()),
        hasPrice: pricingFields.price_type === 'fixed' ? pricingFields.rate > 0 : pricingFields.price_min > 0,
        availability: nextAvail,
        bookings: existing.bookings || 0,
        likes: existing.likes || 0,
        rating: existing.rating || 0,
      })

      await query(
        `UPDATE hats SET
          hat_title = COALESCE($1, hat_title),
          verified_name = COALESCE($2, verified_name),
          is_verified = $3,
          category = COALESCE($4, category),
          skills = COALESCE($5, skills),
          hat_type = COALESCE($6, hat_type),
          delivery_mode = COALESCE($7, delivery_mode),
          country = COALESCE($8, country),
          country_flag = COALESCE($9, country_flag),
          currency = COALESCE($10, currency),
          lga = COALESCE($11, lga),
          motto = COALESCE($12, motto),
          price_type = $13,
          price_min = $14,
          price_max = $15,
          price_negotiable = $16,
          rate = $17,
          rate_unit = $18,
          rate_unit_custom = $19,
          availability = COALESCE($20, availability),
          active = COALESCE($21, active),
          role = COALESCE($22, role),
          available_from = $23,
          available_to = $24,
          orbit_score = $25
        WHERE id = $26`,
        [
          body.hat_title ?? null,
          body.verified_name ?? null,
          verified,
          body.category ?? null,
          body.skills ?? null,
          body.hat_type ?? null,
          body.delivery_mode ?? null,
          body.country ?? null,
          body.country_flag ?? null,
          body.currency ?? null,
          body.lga ?? null,
          body.motto ?? null,
          pricingFields.price_type,
          pricingFields.price_min,
          pricingFields.price_max,
          pricingFields.price_negotiable,
          pricingFields.rate,
          pricingFields.rate_unit,
          pricingFields.rate_unit_custom,
          body.availability ?? null,
          body.active ?? null,
          body.role ?? null,
          body.available_from ?? existing.available_from ?? null,
          body.available_to ?? existing.available_to ?? null,
          orbitScore,
          id,
        ],
      )

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