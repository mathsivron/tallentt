import { useEffect, useState } from 'react'
import { MapPin, Clock, X, BookOpen, Send, Lock, Unlock } from 'lucide-react'

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
// range (min–max, optionally negotiable).
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

  const isTalent = hat.role === 'talent'
  const pillBg = isTalent ? 'bg-[#0A13E6] text-white' : 'bg-black text-white'
  const media = hat.media?.[0]
  // Clients don't need a motto shown — talent voice only.
  const motto = isTalent && hat.motto
    ? hat.motto.length > 60
      ? hat.motto.slice(0, 60) + '…'
      : hat.motto
    : ''
  const currency = hat.currency || 'NGN'
  // Talent's specific location — LGA/city + country, not just a bare city name.
  const location = [hat.lga, hat.country].filter(Boolean).join(', ')
  const availabilityWindow = formatAvailabilityWindow(hat)

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
              <Avatar src={hat.owner_avatar || hat.avatar_url} name={hat.username} className="w-14 h-14" />
              <div>
                <h2 className="text-[18px] font-bold flex items-center gap-1.5 leading-tight">
                  {hat.username}
                  {hat.is_verified && <span className="text-[#0A13E6]">✓</span>}
                </h2>
                <p className="text-[13px] text-black/60">{hat.hat_title}</p>
                {motto && (
                  <p className="text-[13px] text-black/80 italic leading-snug mt-1">"{motto}"</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={`${pillBg} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] border-black`}>
                {hat.hat_type}
              </span>
              {hat.category && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10">
                  {hat.category}
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

            <p className="text-[16px] font-bold">{formatPrice(hat, currency)}</p>

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