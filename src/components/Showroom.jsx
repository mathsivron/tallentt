import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { api } from '../lib/api'
import BentoCard from './BentoCard'

const FILTERS = ['All', 'Models', 'Actors', 'Musicians', 'Creators', 'Developers']

export default function Showroom({ onBook }) {
  const [hats, setHats] = useState([])
  const [orbits, setOrbits] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customOrbit, setCustomOrbit] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getShowroom()
        if (!cancelled) {
          setHats(data.hats || [])
          setOrbits(data.orbits || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = hats.filter((h) => {
    if (availableOnly && !h.availability) return false
    if (filter !== 'All' && h.orbit !== filter && !(h.orbit || '').toLowerCase().includes(filter.toLowerCase())) return false
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

  async function addOrbit() {
    if (!customOrbit.trim()) return
    setAdding(true)
    try {
      const { orbit } = await api.createOrbit(customOrbit.trim())
      setOrbits((prev) => [...prev, orbit].sort((a, b) => a.name.localeCompare(b.name)))
      setCustomOrbit('')
      setFilter(orbit.name)
    } catch (e) {
      alert(e.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-2xl font-bold">Showroom</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search name / skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A13E6]/30"
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
            Available only
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f ? 'bg-[#0A13E6] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
        {orbits
          .filter((o) => !FILTERS.includes(o.name))
          .map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setFilter(o.name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === o.name ? 'bg-[#0A13E6] text-white' : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {o.name}
            </button>
          ))}
        <div className="flex items-center gap-1 ml-1">
          <input
            value={customOrbit}
            onChange={(e) => setCustomOrbit(e.target.value)}
            placeholder="Custom orbit"
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm w-32"
          />
          <button
            type="button"
            disabled={adding}
            onClick={addOrbit}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
            title="Add custom orbit"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 py-12 text-center">Loading showroom…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">No talents match your filters.</p>
      ) : (
        <div className="hats-grid">
          {filtered.map((h) => (
            <div key={h.id} className="relative">
              {h.isHost && (
                <span className="absolute -top-2 left-2 z-10 bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  SHOWROOM HOST
                </span>
              )}
              {h.availability && (
                <span className="absolute -top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  AVAILABLE FOR BOOKING
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
