import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { api } from '../lib/api'
import BentoCard from './BentoCard'

export default function Showroom({ onBook }) {
  const [hats, setHats] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customCategory, setCustomCategory] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getShowroom()
        if (!cancelled) {
          setHats(data.hats || [])
          setCategories(data.categories || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
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
        <div className="hats-grid">
          {filtered.map((h) => (
            <div key={h.id} className="relative pt-2">
              {h.isHost && (
                <span className="absolute -top-0 left-2 z-10 bg-[#FFBD2E] text-black text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border-[1.5px] border-black shadow">
                  Showroom Host
                </span>
              )}
              {h.availability && (
                <span className="absolute -top-0 right-2 z-10 bg-[#16C784] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border-[1.5px] border-black shadow">
                  Available
                </span>
              )}
              <BentoCard hat={h} onBook={onBook} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
