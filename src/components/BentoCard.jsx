import { useState, useEffect } from 'react'
import { Heart, MapPin, Star, X, BookOpen, Send, Lock, Unlock } from 'lucide-react'

const fmt = (n, currency = 'NGN') => {
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

export default function BentoCard({ hat, onBook, onApply, escrow }) {
  const [open, setOpen] = useState(false)

  // Lock body scroll on Android/iOS while modal is open
  useEffect(() => {
    if (!open) return
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
  }, [open])
  const isTalent = hat.role === 'talent'
  const pillBg = isTalent ? 'bg-[#0A13E6] text-white' : 'bg-black text-white'
  const media = hat.media?.[0]
  const motto = hat.motto
    ? hat.motto.length > 60
      ? hat.motto.slice(0, 60) + '…'
      : hat.motto
    : ''
  const currency = hat.currency || 'NGN'

  return (
    <>
      <article
        className="bg-white rounded-[20px] border-[1.5px] border-black shadow-sm overflow-hidden flex flex-col max-w-[300px] w-full cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow"
        onClick={() => setOpen(true)}
      >
        {/* Media */}
        <div className="relative aspect-[4/3] bg-[#F5F3EF]">
          {media?.url ? (
            media.type === 'video' ? (
              <video src={media.url} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/30 text-[12px] font-medium">
              No media
            </div>
          )}
          <span
            className={`absolute top-2.5 left-2.5 ${pillBg} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] border-black`}
          >
            {hat.hat_type || (isTalent ? 'Talent' : 'Client')}
          </span>
          {hat.availability && (
            <span
              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#16C784] border-[1.5px] border-white"
              title="Available"
            />
          )}
        </div>

        {/* Body */}
        <div className="p-3.5 flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar src={hat.owner_avatar || hat.avatar_url} name={hat.username} className="w-11 h-11" />
            <div className="min-w-0">
              <p className="font-semibold text-[14px] truncate leading-tight flex items-center gap-1">
                {hat.username}
                {hat.is_verified && (
                  <span className="text-[#0A13E6] text-[12px]" title="Verified">
                    ✓
                  </span>
                )}
              </p>
              <p className="text-[12px] text-black/50 truncate">{hat.hat_title}</p>
            </div>
          </div>

          {motto && <p className="text-[12px] text-black/70 leading-snug line-clamp-2 italic">"{motto}"</p>}

          <div className="flex items-center gap-2 text-[11px] text-black/50 font-medium">
            {hat.lga && (
              <span className="flex items-center gap-0.5">
                <MapPin size={11} /> {hat.lga}
              </span>
            )}
            {hat.orbit && (
              <span className="truncate px-2 py-0.5 rounded-full bg-[#F5F3EF] border border-black/10">
                {hat.orbit}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="font-bold text-[14px]">{fmt(hat.price_min || hat.rate, currency)}</span>
            <div className="flex items-center gap-2.5 text-[11px] text-black/50">
              <span className="flex items-center gap-0.5">
                <Star size={12} className="text-amber-400 fill-amber-400" /> {Number(hat.rating || 0).toFixed(1)}
              </span>
              {(hat.orbit_score != null || hat.confidence != null) && (
                <span className="text-[10px] font-bold tracking-wide text-[#0A13E6]" title="Orbit confidence score">
                  {hat.orbit_score ?? hat.confidence}% conf
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Heart size={12} /> {hat.likes || 0}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`mt-1.5 w-full h-10 rounded-full text-[13px] font-semibold border-[1.5px] border-black text-white transition hover:brightness-110 active:scale-[0.98] ${
              isTalent ? 'bg-[#0A13E6]' : 'bg-black'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              if (isTalent) onBook?.(hat)
              else onApply?.(hat)
            }}
          >
            {isTalent ? 'Book Talent' : 'Apply'}
          </button>
        </div>
      </article>

      {/* Detail modal — full-screen on Android ≤768px */}
      {open && (
        <div
          className="modal-overlay md:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-panel animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#F5F3EF] border-[1.5px] border-black flex items-center justify-center hover:bg-black hover:text-white transition"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="grid md:grid-cols-2 gap-0 min-h-0">
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

              <div className="p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar src={hat.owner_avatar || hat.avatar_url} name={hat.username} className="w-14 h-14" />
                  <div>
                    <h2 className="text-[18px] font-bold flex items-center gap-1.5 leading-tight">
                      {hat.username}
                      {hat.is_verified && <span className="text-[#0A13E6]">✓</span>}
                    </h2>
                    <p className="text-[13px] text-black/60">{hat.hat_title}</p>
                  </div>
                </div>

                {hat.motto && (
                  <p className="text-[13px] text-black/80 italic leading-snug border-l-4 border-[#0A13E6] bg-[#0A13E6]/5 pl-3 py-2 rounded-r-[12px]">
                    "{hat.motto}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <span className={`${pillBg} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] border-black`}>
                    {hat.hat_type}
                  </span>
                  {hat.orbit && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10">
                      {hat.orbit}
                    </span>
                  )}
                  {hat.lga && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black/10 flex items-center gap-1">
                      <MapPin size={11} /> {hat.lga}
                    </span>
                  )}
                </div>

                {hat.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {hat.skills.map((s) => (
                      <span key={s} className="text-[11px] font-medium bg-[#E6F0FF] text-[#0A13E6] px-2.5 py-0.5 rounded-full border border-[#0A13E6]/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[16px] font-bold">
                  {fmt(hat.price_min, currency)}
                  {hat.price_max != null && hat.price_max !== hat.price_min && (
                    <span className="text-black/50 font-medium"> – {fmt(hat.price_max, currency)}</span>
                  )}
                </p>

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
      )}
    </>
  )
}

function EscrowBadge({ hat, escrow }) {
  const funded = escrow?.status === 'secured' || escrow?.status === 'released'
  const amount = escrow?.amount ?? hat.price_min ?? 0

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
