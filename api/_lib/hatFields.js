export const HAT_TYPES = ['Full-time', 'Part-time', 'Freelance', 'Contract', 'One-Off']
export const DELIVERY_MODES = ['Physical', 'Remote', 'Hybrid']
export const RATE_UNITS = ['hr', 'day', 'week', 'month', 'year', 'custom']
export const PRICE_TYPES = ['fixed', 'range']

/**
 * Validates + normalizes the pricing block of a hat submission.
 * Returns { ok: true, fields } or { ok: false, error }.
 * `fields` always carries all six pricing columns (nulling out whichever
 * side of fixed/range isn't active) so callers can spread it straight into
 * an INSERT/UPDATE without extra branching.
 */
export function normalizePricing(body) {
  const price_type = PRICE_TYPES.includes(body.price_type) ? body.price_type : 'fixed'

  if (price_type === 'fixed') {
    const rate = Number(body.rate)
    if (!Number.isFinite(rate) || rate <= 0) {
      return { ok: false, error: 'Enter a fixed rate greater than 0.' }
    }
    const rate_unit = RATE_UNITS.includes(body.rate_unit) ? body.rate_unit : null
    if (!rate_unit) return { ok: false, error: 'Select a rate unit (per hour, day, etc).' }
    if (rate_unit === 'custom' && !String(body.rate_unit_custom || '').trim()) {
      return { ok: false, error: 'Enter a label for the custom rate unit.' }
    }
    return {
      ok: true,
      fields: {
        price_type,
        rate,
        rate_unit,
        rate_unit_custom: rate_unit === 'custom' ? String(body.rate_unit_custom).trim().slice(0, 24) : null,
        price_min: null,
        price_max: null,
        price_negotiable: false,
      },
    }
  }

  // range
  const price_min = Number(body.price_min)
  const price_max = Number(body.price_max)
  if (!Number.isFinite(price_min) || price_min <= 0) {
    return { ok: false, error: 'Enter a minimum price greater than 0.' }
  }
  if (!Number.isFinite(price_max) || price_max < price_min) {
    return { ok: false, error: 'Enter a maximum price greater than or equal to the minimum.' }
  }
  return {
    ok: true,
    fields: {
      price_type,
      rate: null,
      rate_unit: null,
      rate_unit_custom: null,
      price_min,
      price_max,
      price_negotiable: Boolean(body.price_negotiable),
    },
  }
}

/** Human-readable price line, mirrors the frontend preview. */
export function formatPrice(hat, currency) {
  const fmt = (n) => `${currency === 'NGN' ? '₦' : currency + ' '}${Number(n).toLocaleString()}`
  if (hat.price_type === 'range') {
    const base = `${fmt(hat.price_min)} – ${fmt(hat.price_max)}`
    return hat.price_negotiable ? `${base} (negotiable)` : base
  }
  const unit = hat.rate_unit === 'custom' ? hat.rate_unit_custom : `/${hat.rate_unit}`
  return `${fmt(hat.rate)} ${unit || ''}`.trim()
}
