import { useEffect, useState } from 'react'
import { LayoutGrid, List, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import BentoCard from './BentoCard'
import { Link } from 'react-router-dom'

export default function MyHats() {
  const { user } = useAuth()
  const [hats, setHats] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('talentworld_viewMode') || 'grid')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getHats({ user_id: user.id })
        if (!cancelled) setHats(data.hats || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  function setMode(m) {
    setViewMode(m)
    localStorage.setItem('talentworld_viewMode', m)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this hat?')) return
    try {
      await api.deleteHat(id)
      setHats((prev) => prev.filter((h) => h.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p className="text-center text-gray-500 py-12">Loading your hats…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Hats</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#0A13E6] text-white' : 'bg-gray-100'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#0A13E6] text-white' : 'bg-gray-100'}`}
          >
            <List size={18} />
          </button>
          <Link
            to="/create"
            className="ml-2 px-4 py-2 rounded-xl bg-[#0A13E6] text-white text-sm font-medium hover:bg-[#080fb8]"
          >
            + New Hat
          </Link>
        </div>
      </div>

      {hats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">You haven’t created any hats yet.</p>
          <Link to="/create" className="inline-block px-5 py-2.5 rounded-xl bg-[#0A13E6] text-white font-medium">
            Create your first Hat
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="hats-grid">
          {hats.map((h) => (
            <div key={h.id} className="relative group">
              <BentoCard hat={h} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <Link to={`/create?edit=${h.id}`} className="p-1.5 bg-white rounded-lg shadow border">
                  <Pencil size={14} />
                </Link>
                <button type="button" onClick={() => handleDelete(h.id)} className="p-1.5 bg-white rounded-lg shadow border text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="bg-white rounded-2xl border divide-y">
          {hats.map((h) => (
            <li key={h.id} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {h.media?.[0]?.url && <img src={h.media[0].url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{h.hat_title}</p>
                <p className="text-sm text-gray-500">
                  {h.username} · {h.orbit} · {h.role}
                </p>
              </div>
              <span className="text-sm font-medium">₦{(h.price_min || 0).toLocaleString()}</span>
              <Link to={`/create?edit=${h.id}`} className="p-2 text-gray-500 hover:text-[#0A13E6]">
                <Pencil size={16} />
              </Link>
              <button type="button" onClick={() => handleDelete(h.id)} className="p-2 text-gray-500 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
