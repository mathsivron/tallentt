import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import AvailabilityBadge from './AvailabilityBadge'
import AddShowroomMedia from './AddShowroomMedia'

// One full-screen reel slide — pulls its media, name, and motto straight
// off the hat (same data BentoCard uses), autoplaying its video only while
// it's the one in view. "Book Now" takes you to that person's profile
// instead of booking directly from the reel.
function ReelSlide({ hat }) {
  const videoRef = useRef(null)
  const slideRef = useRef(null)
  const media = hat.media?.[0]

  useEffect(() => {
    const video = videoRef.current
    const slide = slideRef.current
    if (!video || !slide) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.6 },
    )
    observer.observe(slide)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={slideRef} className="reel-slide">
      {media?.url ? (
        media.type === 'video' ? (
          <video
            ref={videoRef}
            src={media.url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
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
          <span className="flex items-center gap-1 text-[12px] font-medium">
            <Heart size={14} /> {hat.likes || 0}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Showroom() {
  const [hats, setHats] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customCategory, setCustomCategory] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  async function loadShowroom() {
    try {
      const data = await api.getShowroom()
      setHats(data.hats || [])
      setCategories(data.categories || [])
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
    if (
      filter !== 'All' &&
      h.category !== filter &&
      !(h.category || '').toLowerCase().includes(filter.toLowerCase())
    )
      return false
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

  async function addCategory() {
    if (!customCategory.trim()) return
    setAdding(true)
    try {
      const { category } = await api.createCategory(customCategory.trim())
      setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
      setCustomCategory('')
      setFilter(category.name)
    } catch (e) {
      alert(e.message)
    } finally {
      setAdding(false)
    }
  }

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
            <Plus size={15} /> Add
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

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => setFilter('All')}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border-[1.5px] transition ${
            filter === 'All'
              ? 'bg-[#0A13E6] text-white border-black shadow'
              : 'bg-white border-black/15 text-black/70 hover:border-black hover:text-black'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.name)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border-[1.5px] transition ${
              filter === c.name
                ? 'bg-[#0A13E6] text-white border-black shadow'
                : 'bg-white border-black/15 text-black/70'
            }`}
          >
            {c.name}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          <input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Custom category"
            className="px-3 h-8 rounded-full border-[1.5px] border-black/15 bg-white text-[12px] font-medium w-32 outline-none focus:border-black"
          />
          <button
            type="button"
            disabled={adding}
            onClick={addCategory}
            className="w-8 h-8 rounded-full bg-white border-[1.5px] border-black flex items-center justify-center hover:bg-black hover:text-white transition"
            title="Add custom category"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-black/40 py-16 text-center text-[13px] font-medium">Loading showroom…</p>
      ) : filtered.length === 0 ? (
        <p className="text-black/40 py-16 text-center text-[13px] font-medium">No talents match your filters.</p>
      ) : (
        <div className="reel-container">
          {filtered.map((h) => (
            <ReelSlide key={h.id} hat={h} />
          ))}
        </div>
      )}

      <AddShowroomMedia open={showAdd} onClose={() => setShowAdd(false)} onAdded={loadShowroom} />
    </div>
  )
}