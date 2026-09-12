import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, X, BookOpen, Send, Lock, Unlock, AlertCircle, Play, ImageOff, Heart, Eye } from 'lucide-react'
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

// Publication date, shared by the feed's `created_at` and the detail
// API's `created_at` — same underlying column either way.
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
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

// Wraps the owner identity (avatar and/or username) in the app's existing
// hat-detail route (`/talent/:hatId` — see Showroom.jsx's identical
// `Link to={`/talent/${hat.id}`}`) so clicking either reuses the app's
// existing profile-navigation mechanism instead of introducing a new one.
// Falls back to a plain, non-interactive span if there's no valid card id
// to link to, so an unresolved owner never produces a broken destination.
function OwnerLink({ cardId, className, ariaLabel, children }) {
  if (!cardId) return <span className={className}>{children}</span>
  return (
    <Link to={`/talent/${cardId}`} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
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
//
// Engagement (likes/views) is also one of those fields: buildCardDetail
// (api/hats/[id].js) never includes likes/liked_by_me/views, so those
// always come from the feed's `hat`, mirroring the same optimistic
// like-toggle + rollback used in Showroom's ReelSlide and TalentProfile —
// same api.toggleLike/api.recordView calls, no new endpoints.
//
// `onHatChange`, if given, is called with `{ id, ...patch }` after a
// successful like/view so the parent (Feed) can patch its own `hats`
// list — otherwise the feed card behind the modal would show stale
// counts once the modal closes, with no full refetch required.
export default function BentoCardDetailModal({ hat, escrow, showMedia = true, onClose, onBook, onApply, onHatChange }) {
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

  // Which of this card's media items is shown in the main viewer, and
  // which indices have failed to load (per-item, so one broken item
  // doesn't take out the whole gallery). Reset whenever the modal is
  // pointed at a different card.
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [brokenMedia, setBrokenMedia] = useState(() => new Set())
  const markMediaBroken = useCallback((idx) => {
    setBrokenMedia((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)))
  }, [])
  useEffect(() => {
    setActiveMediaIndex(0)
    setBrokenMedia(new Set())
  }, [cardId])

  // Engagement — sourced from the feed's `hat` (see note above on why
  // `detail` can't be used for this), reset whenever the modal points at
  // a different card. Mirrors Showroom's ReelSlide / TalentProfile state
  // shape exactly (liked / likeCount / viewCount / liking).
  const [liked, setLiked] = useState(!!hat?.liked_by_me)
  const [likeCount, setLikeCount] = useState(hat?.likes || 0)
  const [viewCount, setViewCount] = useState(hat?.views || 0)
  const [liking, setLiking] = useState(false)
  const viewedRef = useRef(null)

  useEffect(() => {
    setLiked(!!hat?.liked_by_me)
    setLikeCount(hat?.likes || 0)
    setViewCount(hat?.views || 0)
  }, [cardId, hat?.liked_by_me, hat?.likes, hat?.views])

  // Record one view per card per time the modal is open — same
  // fire-and-forget api.recordView call TalentProfile/Showroom make, with
  // the same "don't surface view-count failures" behavior.
  useEffect(() => {
    if (!cardId || viewedRef.current === cardId) return
    viewedRef.current = cardId
    setViewCount((v) => {
      const next = v + 1
      onHatChange?.({ id: cardId, views: next })
      return next
    })
    api.recordView(cardId).catch(() => {})
  }, [cardId, onHatChange])

  async function handleLike() {
    if (liking || !cardId) return
    setLiking(true)
    const next = !liked
    const nextCount = likeCount + (next ? 1 : -1)
    setLiked(next)
    setLikeCount(nextCount)
    try {
      await api.toggleLike(cardId)
      onHatChange?.({ id: cardId, liked_by_me: next, likes: nextCount })
    } catch (e) {
      // Restore the previous state — never leave the UI showing a like
      // the server rejected (e.g. session expired, so the PATCH 401s).
      setLiked(!next)
      setLikeCount(likeCount)
    } finally {
      setLiking(false)
    }
  }


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
  // Both the feed's partial hat and the full detail carry the same shape:
  // an ordered array of { url, type, caption }, newest first (see
  // AddShowroomMedia's "prepend to front" comment). Drop entries with no
  // url up front — those can never render anything, image/video error
  // handlers below cover urls that are present but fail to load.
  const rawMedia = loaded ? detail.media : hat.media
  const mediaItems = Array.isArray(rawMedia) ? rawMedia.filter((m) => m?.url) : []
  const hasMedia = mediaItems.length > 0
  // Clamp defensively in case the list is ever shorter than the last
  // selected index (e.g. the fuller detail response has fewer items than
  // the feed card did).
  const safeMediaIndex = hasMedia ? Math.min(activeMediaIndex, mediaItems.length - 1) : 0
  const activeMedia = hasMedia ? mediaItems[safeMediaIndex] : null
  const activeMediaBroken = brokenMedia.has(safeMediaIndex)
  // Username is the app's identity — never the owner's full name (see
  // owner.name in api/hats/[id].js, which is full-name-or-username and is
  // intentionally not used here).
  const displayName = owner?.handle || hat.username || null
  const avatarSrc = owner?.avatar_url || hat.owner_avatar || hat.avatar_url
  const isVerified = loaded ? Boolean(owner?.is_verified) : Boolean(hat.is_verified)
  const category = loaded ? detail.category : hat.category
  // Owner-level profile fields — only present once the full detail has
  // loaded; the feed card carries no equivalent for either.
  const ownerLocation = loaded ? owner?.location : null
  const ownerBio = loaded ? owner?.bio_short : null
  // Card title — the primary heading for the detail view.
  const titleLine = loaded ? detail.title : hat.hat_title
  // Full description/content — no truncation and no role gate here; this
  // is the detail view, not the feed preview. Shown whenever the card
  // actually has one.
  const description = loaded ? detail.description : hat.motto
  const tags = (loaded ? detail.tags : hat.skills) || []
  const hatTypeLabel = hat.hat_type || (isTalent ? 'Talent' : 'Client')
  const currency = (loaded ? detail.budget?.currency : hat.currency) || 'NGN'
  // Talent's specific location — LGA/city + country, not just a bare city name.
  const location = loaded ? detail.location : [hat.lga, hat.country].filter(Boolean).join(', ')
  // No equivalent in the normalized detail — always sourced from the feed card.
  const availabilityWindow = formatAvailabilityWindow(hat)
  const priceDisplay = loaded ? formatBudget(detail.budget) : formatPrice(hat, currency)
  const publishedLabel = formatDate(loaded ? detail.created_at : hat.created_at)

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
            <div className="modal-media bg-[#F5F3EF] min-h-[240px] border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black flex flex-col">
              <div className="relative flex-1 min-h-0 flex items-center justify-center">
                {hasMedia && !activeMediaBroken ? (
                  activeMedia.type === 'video' ? (
                    <video
                      key={activeMedia.url}
                      src={activeMedia.url}
                      controls
                      className="w-full h-full object-contain max-h-[70vh]"
                      aria-label={activeMedia.caption || `${displayName || 'Portfolio'} video`}
                      onError={() => markMediaBroken(safeMediaIndex)}
                    />
                  ) : (
                    <img
                      key={activeMedia.url}
                      src={activeMedia.url}
                      alt={activeMedia.caption || (displayName ? `${displayName}'s work` : 'Portfolio media')}
                      className="w-full h-full object-contain max-h-[70vh]"
                      onError={() => markMediaBroken(safeMediaIndex)}
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-64 text-black/30 text-[13px]">
                    {hasMedia ? 'This media couldn\u2019t be loaded' : 'No portfolio'}
                  </div>
                )}
              </div>

              {mediaItems.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Portfolio media"
                  className="flex gap-1.5 p-2 overflow-x-auto shrink-0 border-t-[1.5px] border-black/10 bg-white/60"
                >
                  {mediaItems.map((m, idx) => {
                    const broken = brokenMedia.has(idx)
                    const selected = idx === safeMediaIndex
                    return (
                      <button
                        key={`${m.url}-${idx}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-label={`View ${m.type === 'video' ? 'video' : 'photo'} ${idx + 1} of ${mediaItems.length}`}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-[1.5px] transition ${
                          selected ? 'border-[#0A13E6]' : 'border-black/10 hover:border-black/30'
                        }`}
                      >
                        {broken ? (
                          <div className="w-full h-full flex items-center justify-center bg-[#F5F3EF] text-black/25">
                            <ImageOff size={14} />
                          </div>
                        ) : m.type === 'video' ? (
                          <div className="relative w-full h-full bg-black">
                            <video
                              src={m.url}
                              className="w-full h-full object-cover opacity-70"
                              muted
                              playsInline
                              preload="metadata"
                              onError={() => markMediaBroken(idx)}
                            />
                            <Play size={12} className="absolute inset-0 m-auto text-white" fill="white" />
                          </div>
                        ) : (
                          <img
                            src={m.url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={() => markMediaBroken(idx)}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="p-5 md:p-6 space-y-4 min-w-0">
            {/* Owner section — visually separated from the card content
                below via the surface background, matching the app's
                existing muted-panel convention (used for pills, media bg). */}
            <div className="flex items-center gap-3 min-w-0 bg-[#F5F3EF] border-[1.5px] border-black/10 rounded-2xl p-3">
              <OwnerLink
                cardId={cardId}
                className="shrink-0"
                ariaLabel={displayName ? `View ${displayName}'s profile` : undefined}
              >
                <Avatar src={avatarSrc} name={displayName} className="w-11 h-11" />
              </OwnerLink>
              <div className="min-w-0 flex-1">
                {displayName ? (
                  <OwnerLink cardId={cardId} className="text-[13px] font-semibold flex items-center gap-1 truncate hover:underline w-fit">
                    {displayName}
                    {isVerified && <span className="text-[#0A13E6]">✓</span>}
                  </OwnerLink>
                ) : (
                  <p className="text-[13px] font-medium text-black/40">Unknown creator</p>
                )}
                {category && <p className="text-[11px] text-black/50 font-medium truncate">{category}</p>}
                {ownerLocation && (
                  <p className="text-[11px] text-black/40 font-medium truncate flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {ownerLocation}
                  </p>
                )}
                {ownerBio && (
                  <p className="text-[11px] text-black/50 leading-snug mt-1 break-words">{ownerBio}</p>
                )}
              </div>
            </div>

            {publishedLabel && (
              <p className="text-[11px] text-black/40 font-medium -mt-2">Posted {publishedLabel}</p>
            )}

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

            {titleLine && (
              <h2 className="text-[19px] md:text-[20px] font-bold leading-snug break-words">{titleLine}</h2>
            )}

            {description && (
              <p className="text-[14px] text-black/70 leading-relaxed break-words whitespace-pre-line">
                {description}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-black/10 text-black/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              <span className={`${pillBg} text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] border-black`}>
                {hatTypeLabel}
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

            {/* Engagement — same Heart/Eye icons and optimistic toggle used
                on Showroom's reel and the talent profile page; secondary
                to price/tags above, not a redesign of the modal. */}
            <div className="flex items-center gap-3 text-[12px] text-black/50 font-medium -mt-1">
              <button
                type="button"
                onClick={handleLike}
                disabled={liking}
                aria-pressed={liked}
                aria-label={liked ? 'Unlike' : 'Like'}
                className="flex items-center gap-1 hover:text-black transition disabled:opacity-50"
              >
                <Heart size={14} className={liked ? 'fill-[#FF3B5C] text-[#FF3B5C]' : ''} /> {likeCount}
              </button>
              <span className="flex items-center gap-1">
                <Eye size={14} /> {viewCount}
              </span>
            </div>

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