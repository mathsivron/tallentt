import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Heart, MapPin, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import AvailabilityBadge from './AvailabilityBadge'
import AddShowroomMedia from './AddShowroomMedia'

// One full-screen reel slide. Only plays its video while `active` — i.e.
// it's the slide currently snapped into view — driven by a single shared
// observer up in Showroom rather than one per slide, so exactly one video
// plays at a time. Also fires a view once, and lets the viewer like it.
function ReelSlide({ hat, active }) {
  const videoRef = useRef(null)
  const viewedRef = useRef(false)
  const media = hat.media?.[0]

  const [liked, setLiked] = useState(!!hat.liked_by_me)
  const [likeCount, setLikeCount] = useState(hat.likes || 0)
  const [viewCount, setViewCount] = useState(hat.views || 0)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    setLiked(!!hat.liked_by_me)
    setLikeCount(hat.likes || 0)
    setViewCount(hat.views || 0)
  }, [hat.id, hat.liked_by_me, hat.likes, hat.views])

  useEffect(() => {
    const video = videoRef.current
    if (active) {
      if (!viewedRef.current) {
        viewedRef.current = true
        setViewCount((v) => v + 1)
        api.recordView(hat.id).catch(() => {})
      }
      if (video) {
        // React's `muted` JSX prop sets the attribute but doesn't always
        // sync the live DOM property in time — browsers check the live
        // property before allowing autoplay, so set it explicitly here.
        video.muted = true
        video.play().catch(() => {})
      }
    } else if (video) {
      video.pause()
    }
  }, [active, hat.id])

  async function handleLike() {
    if (liking) return
    setLiking(true)
    const next = !liked
    setLiked(next)
    setLikeCount((c) => c + (next ? 1 : -1))
    try {
      await api.toggleLike(hat.id)
    } catch (e) {
      setLiked(!next)
      setLikeCount((c) => c + (next ? -1 : 1))
    } finally {
      setLiking(false)
    }
  }

  return (
    <div data-hat-id={hat.id} className="reel-slide">
      {media?.url ? (
        media.type === 'video' ? (
          <video
            ref={videoRef}
            src={media.url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={media.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[13px] font-medium">
          No media
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {hat.isHost && (
        <span className="absolute top-3 left-3 z-10 bg-[#FFBD2E] text-black text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border-[1.5px] border-black shadow">
          Showroom Host
        </span>
      )}
      <AvailabilityBadge available={hat.availability} className="absolute top-3 right-3 z-10" />

      <div className="relative z-10 w-full p-4 sm:p-5 text-white">
        <p className="font-bold text-[16px] leading-tight flex items-center gap-1">
          {hat.username}
          {hat.is_verified && <span className="text-[#7C9CFF]">✓</span>}
        </p>
        {(media?.caption || hat.motto) && (
          <p className="text-[13px] text-white/85 italic leading-snug mt-1 line-clamp-2">
            "{media?.caption || hat.motto}"
          </p>
        )}
        {hat.lga && (
          <p className="text-[11px] text-white/70 font-medium mt-1.5 flex items-center gap-1">
            <MapPin size={11} /> {[hat.lga, hat.country].filter(Boolean).join(', ')}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Link
            to={`/talent/${hat.id}`}
            className="flex-1 h-10 rounded-full bg-[#0A13E6] text-white text-[13px] font-semibold border-[1.5px] border-white/20 flex items-center justify-center"
          >
            Book Now
          </Link>
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1 text-[12px] font-medium"
            aria-pressed={liked}
          >
            <Heart size={16} className={liked ? 'fill-[#FF3B5C] text-[#FF3B5C]' : ''} /> {likeCount}
          </button>
          <span className="flex items-center gap-1 text-[12px] font-medium text-white/70">
            <Eye size={14} /> {viewCount}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Showroom() {
  const [hats, setHats] = useState([])
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

  async function loadShowroom() {
    try {
      const data = await api.getShowroom()
      setHats(data.hats || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShowroom()
  }, [])

  const filtered = hats.filter((h) => {
    if (availableOnly && !h.availability) return false
    if (search) {
      const q = search.toLowerCase()
      const match =
        (h.username || '').toLowerCase().includes(q) ||
        (h.hat_title || '').toLowerCase().includes(q) ||
        (h.skills || []).some((s) => s.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })

  // Filters/search reshuffle which slide is "first" — snap back to it.
  useEffect(() => {
    setActiveIndex(0)
    containerRef.current?.scrollTo({ top: 0 })
  }, [search, availableOnly])

  // One observer watching every slide at once decides which single index
  // is "active" (i.e. snapped fully into view) — that's what drives which
  // video plays and which slide counts as viewed.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const slides = Array.from(container.querySelectorAll('[data-hat-id]'))
    if (!slides.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (!visible.length) return
        const top = visible.reduce((a, b) => (b.intersectionRatio > a.intersectionRatio ? b : a))
        const idx = slides.indexOf(top.target)
        if (idx !== -1) setActiveIndex(idx)
      },
      { root: container, threshold: [0.6] },
    )
    slides.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [hats, search, availableOnly])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Showroom</h1>
          <p className="text-[12px] text-black/50 font-medium mt-0.5">
            Curated top talents · sorted by bookings + orbit score + likes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="h-10 px-4 rounded-full bg-[#0A13E6] text-white text-[13px] font-semibold border-[1.5px] border-black shadow-[0_4px_12px_rgba(10,19,230,0.25)] hover:bg-black transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} /> Add Spotlight
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="search"
              placeholder="Search name / skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-full border-[1.5px] border-black bg-white text-[13px] font-medium outline-none focus:ring-4 focus:ring-black/[0.04]"
            />
          </div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-black"
            />
            Available only
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-black/40 py-16 text-center text-[13px] font-medium">Loading showroom…</p>
      ) : filtered.length === 0 ? (
        <p className="text-black/40 py-16 text-center text-[13px] font-medium">No talents match your filters.</p>
      ) : (
        <div className="reel-container" ref={containerRef}>
          {filtered.map((h, i) => (
            <ReelSlide key={h.id} hat={h} active={i === activeIndex} />
          ))}
        </div>
      )}

      <AddShowroomMedia open={showAdd} onClose={() => setShowAdd(false)} onAdded={loadShowroom} />
    </div>
  )
}