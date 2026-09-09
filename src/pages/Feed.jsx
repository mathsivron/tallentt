import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '../lib/api'
import BentoCard from '../components/BentoCard'
import { useBrowseRole } from '../components/Layout'

export default function Feed() {
  const browseRole = useBrowseRole()
  const hatRole = browseRole === 'creator' ? 'client' : 'talent'
  const [hats, setHats] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await api.getHats({ role: hatRole, search: search || undefined })
        if (!cancelled) setHats(data.hats || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [hatRole, search])

  async function handleBook(hat) {
    try {
      const { escrow } = await api.createEscrow({ hat_id: hat.id, talent_id: hat.user_id })
      if (confirm(`Escrow created for ₦${escrow.amount.toLocaleString()}. Fund now to unlock contacts?`)) {
        await api.fundEscrow(escrow.id)
        alert('Escrow secured! Contacts unlocked.')
      }
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleApply(hat) {
    alert(`Application sent for “${hat.hat_title}”. (Demo — wire messaging next.)`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Feed</h1>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder={hatRole === 'talent' ? 'Search talents…' : 'Search clients…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A13E6]/30"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading…</p>
      ) : hats.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No hats yet. Create one or check back soon.</p>
      ) : (
        <div className="hats-grid">
          {hats.map((h) => (
            <BentoCard key={h.id} hat={h} onBook={handleBook} onApply={handleApply} />
          ))}
        </div>
      )}
    </div>
  )
}
