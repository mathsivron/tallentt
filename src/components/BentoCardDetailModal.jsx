import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Clock, X, BookOpen, Send, Lock, Unlock, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'

const fmtMoney = (n, currency = 'NGN') => {
  if (n == null) return '—'
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `₦${Number(n).toLocaleString()}`
  }
}

// Mirrors api/_lib/hatFields.js's formatPrice — fixed (rate + unit) vs
// range (min–max, optionally negotiable). Used for the feed's partial
// hat shape (price_type/rate/rate_unit/...).
function formatPrice(hat, currency) {
  if (hat.price_type === 'range' && hat.price_min != null) {
    const base =
      hat.price_max != null && hat.price_max !== hat.price_min
        ? `${fmtMoney(hat.price_min, currency)} – ${fmtMoney(hat.price_max, currency)}`
        : fmtMoney(hat.price_min, currency)
    return hat.price_negotiable ? `${base} · negotiable` : base
  }
  if (hat.rate != null) {
    const unit = hat.rate_unit === 'custom' ? hat.rate_unit_custom : hat.rate_unit ? `/${hat.rate_unit}` : ''
    return `${fmtMoney(hat.rate, currency)}${unit ? ` ${unit}` : ''}`
  }
  return '—'
}

// Same pricing logic, adapted for the normalized `budget` object the
// detail API returns (api/hats/[id].js buildCardDetail): { type, currency,
// amount, min, max, unit, negotiable }. `unit` there is already resolved
// (custom-or-standard) into one string, so a slash is only prepended for
// short standard units — a free-text custom unit (e.g. "per session")
// reads fine on its own.
function formatBudget(budget) {
  if (!budget) return '—'
  const currency = budget.currency || 'NGN'
  if (budget.type === 'range' && budget.min != null) {
    const base =
      budget.max != null && budget.max !== budget.min
        ? `${fmtMoney(budget.min, currency)} – ${fmtMoney(budget.max, currency)}`
        : fmtMoney(budget.min, currency)
    return budget.negotiable ? `${base} · negotiable` : base
  }
  if (budget.amount != null) {
    const unitText = budget.unit ? (budget.unit.includes(' ') ? ` ${budget.unit}` : ` /${budget.unit}`) : ''
    return `${fmtMoney(budget.amount, currency)}${unitText}`
  }
  return '—'
}

// "15:00:00" (DB TIME) or "15:00" (HTML time input) -> "3:00 PM"
function formatTime(t) {
  if (!t) return ''
  const [hStr, mStr] = String(t).split(':')
  let h = Number(hStr)
  const m = Number(mStr || 0)
  const suffix = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`
}

function formatAvailabilityWindow(hat) {
  if (!hat.available_from && !hat.available_to) return ''
  if (hat.available_from && hat.available_to) {
    return `${formatTime(hat.available_from)} – ${formatTime(hat.available_to)}`
  }
  return formatTime(hat.available_from || hat.available_to)
}

function Avatar({ src, name, className = 'w-12 h-12' }) {
  const [err, setErr] = useState(false)
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (!src || err) {
    return (
      <div className={`${className} rounded-full bg-black text-white flex items-center justify-center font-bold text-[12px] border-[1.5px] border-black shrink-0`}>
        {initials}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${className} rounded-full object-cover border-[1.5px] border-black shrink-0`}
      onError={() => setErr(true)}
    />
  )
}

function EscrowBadge({ hat, escrow }) {
  const funded = escrow?.status === 'secured' || escrow?.status === 'released'
  const fallback = hat.price_type === 'range' ? hat.price_min : hat.rate
  const amount = escrow?.amount ?? fallback ?? 0

  if (funded) {
    return (
      <div className="escrow-secured inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E8FFE6] text-[#0A7A00] text-[12px] font-semibold border-[1.5px] border-[#0A7A00]/20">
        <Unlock size={14} /> ₦{Number(amount).toLocaleString()} Secured • Contacts Unlocked
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E6F0FF] text-[#0A13E6] text-[12px] font-semibold border-[1.5px] border-[#0A13E6]/20">
      <Lock size={14} /> Escrow: Not Funded • Contacts Locked
    </div>
  )
}

// The BentoCard detail modal — extracted verbatim (markup, styling, and
// behavior unchanged) so there's a single implementation of this UI
// instead of it living inline in BentoCard.jsx.
//
// BentoCard still owns the `open` state and only mounts this component
// while open, so the body-scroll lock here runs on mount/unmount, which
// is equivalent to the previous `open`-driven effect.
//
// `hat` is the partial feed card — shown immediately for continuity. On
// mount (and whenever the card id changes) this also fetches the full
// GET /api/hats/:id?include=owner detail and, once loaded, that becomes
// the source of truth for title/description/media/tags/category/budget/
// location/owner/has_applied/has_booked. Fields the normalized detail
// doesn't carry (hat_type, delivery_mode, the availability window) have
// no API equivalent, so they keep coming from the feed card throughout.
export default function BentoCardDetailModal({ hat, escrow, showMedia = true, onClose, onBook, onApply }) {
  useEffect(() => {
    const scrollY = window.scrollY
    document.documentElement.classList.add('modal-open')
    document.body.classList.add('modal-open')
    document.body.style.top = `-${scrollY}px`
    return () => {
      document.documentElement.classList.remove('modal-open')
      document.body.classList.remove('modal-open')
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const cardId = hat?.id ?? null

  const [detail, setDetail] = useState(null)
  // 'idle' (no id to fetch) | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState(cardId ? 'loading' : 'idle')
  const [errorMessage, setErrorMessage] = useState(null)

  // Tracks the most recently *issued* request so a slow, older response
  // (e.g. Card A) can't overwrite a newer one (Card B) if the user opens
  // cards in quick succession while this component stays mounted.
  const latestRequestId = useRef(0)
  // Tracks the id that's currently loaded/loading, so we don't refetch
  // when the same card is already loaded.
  const loadedCardId = useRef(null)

  const fetchDetail = useCallback((id) => {
    const requestId = ++latestRequestId.current
    setStatus('loading')
    setErrorMessage(null)
    api
      .getHatDetail(id)
      .then((data) => {
        if (latestRequestId.current !== requestId) return // stale — a newer request won
        loadedCardId.current = id
        setDetail(data)
        setStatus('success')
      })
      .catch((err) => {
        if (latestRequestId.current !== requestId) return
        setErrorMessage(err?.message || 'Failed to load details')
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    if (!cardId) {
      // No valid card id to fetch — fall back to whatever the feed gave
      // us instead of calling the API with an invalid value.
      latestRequestId.current++ // invalidate any in-flight request
      loadedCardId.current = null
      setDetail(null)
      setStatus('idle')
      return
    }
    if (loadedCardId.current === cardId) return // already loaded/loading this card
    fetchDetail(cardId)
  }, [cardId, fetchDetail])

  function handleRetry() {
    if (cardId) fetchDetail(cardId)
  }

  const loaded = status === 'success' && detail
  const owner = loaded ? detail.owner : null

  const isTalent = (owner?.role ?? hat.role) === 'talent'
  const pillBg = isTalent ? 'bg-[#0A13E6] text-white' : 'bg-black text-white'
  const media = loaded ? detail.media?.[0] : hat.media?.[0]
  const displayName = owner?.handle || owner?.name || hat.username
  const avatarSrc = owner?.avatar_url || hat.owner_avatar || hat.avatar_url
  const isVerified = loaded ? Boolean(owner?.is_verified) : Boolean(hat.is_verified)
  const titleLine = loaded ? detail.title : hat.hat_title
  const rawDescription = loaded ? detail.description : hat.motto
  // Clients don't need a motto/description shown — talent voice only.
  const description = isTalent && rawDescription
    ? rawDescription.length > 60
      ? rawDescription.slice(0, 60) + '…'
      : rawDescription
    : ''
  const category = loaded ? detail.category : hat.category
  const currency = (loaded ? detail.budget?.currency : hat.currency) || 'NGN'
  // Talent's specific location — LGA/city + country, not just a bare city name.
  const location = loaded ? detail.location : [hat.lga, hat.country].filter(Boolean).join(', ')
  // No equivalent in the normalized detail — always sourced from the feed card.
  const availabilityWindow = formatAvailabilityWindow(hat)
  const priceDisplay = loaded ? formatBudget(detail.budget) : formatPrice(hat, currency)

  return (
    <div
      className="modal-overlay md:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#F5F3EF] border-[1.5px] border-black flex items-center justify-center hover:bg-black hover:text-white transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className={showMedia ? 'grid md:grid-cols-2 gap-0 min-h-0' : 'min-h-0'}>
          {showMedia && (
            <div className="modal-media bg-[#F5F3EF] min-h-[240px] border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black">
              {media?.url ? (
                media.type === 'video' ? (
                  <video src={media.url} controls className="w-full h-full object-contain max-h-[70vh]" />
                ) : (
                  <img src={media.url} alt="" className="w-full h-full object-contain max-h-[70vh]" />
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-black/30 text-[13px]">No portfolio</div>
              )}
            </div>
          )}

          <div className="p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={avatarSrc} name={displayName} className="w-14 h-14" />
              <div>
                <h2 className="text-[18px] font-bold flex items-center gap-1.5 leading-tight">
                  {displayName}
                  {isVerified && <span className="text-[#0A13E6]">✓</span>}
                </h2>
                <p className="text-[13px] text-black/60">{titleLine}</p>
                {description && (
                  <p className="text-[13px] text-black/80 italic leading-snug mt-1">"{description}"</p>
                )}
              </div>
            </div>

            {status === 'loading' && (
              <p className="text-[11px] text-black/40 font-medium">Loading full details…</p>
            )}

            {status === 'error' && (
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[#FFF3F0] border-[1.5px] border-[#E6260A]/20 text-[#E6260A]">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <AlertCircle size={14} /> {errorMessage || 'Couldn\u2019t load full details.'}
                </span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="shrink-0 text-[12px] font-bold underline underline-offset-2 hover:opacity-70"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              <span className={`${pillBg} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] border-black`}>
                {hat.hat_type}
              </span>
              {category && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10">
                  {category}
                </span>
              )}
              {hat.delivery_mode && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10">
                  {hat.delivery_mode}
                </span>
              )}
              {location && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10 flex items-center gap-1" title="Talent location">
                  <MapPin size={11} /> {location}
                </span>
              )}
              {availabilityWindow && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10 flex items-center gap-1" title="Daily availability window">
                  <Clock size={11} /> {availabilityWindow}
                </span>
              )}
            </div>

            <p className="text-[16px] font-bold">{priceDisplay}</p>

            <EscrowBadge hat={hat} escrow={escrow} />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className={`flex-1 h-12 rounded-full text-white font-semibold text-[14px] border-[1.5px] border-black flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(10,19,230,0.25)] hover:bg-black transition ${
                  isTalent ? 'bg-[#0A13E6]' : 'bg-black'
                }`}
                onClick={() => (isTalent ? onBook?.(hat) : onApply?.(hat))}
              >
                {isTalent ? <BookOpen size={16} /> : <Send size={16} />}
                {isTalent ? 'Book Talent' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}