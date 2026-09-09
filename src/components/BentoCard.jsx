import { useState } from 'react'
import { Heart, MapPin, Star, X, BookOpen, Send } from 'lucide-react'

const fmt = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

export default function BentoCard({ hat, viewAs = 'talent', onBook, onApply, onLike }) {
  const [open, setOpen] = useState(false)
  const isTalent = hat.role === 'talent'
  const pillColor = isTalent ? 'bg-[#0A13E6]' : 'bg-black'
  const media = hat.media?.[0]
  const motto = hat.motto ? (hat.motto.length > 60 ? hat.motto.slice(0, 60) + '…' : hat.motto) : ''

  return (
    <>
      <article
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-w-[300px] w-full cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setOpen(true)}
      >
        <div className="relative aspect-[4/3] bg-gray-100">
          {media?.url ? (
            media.type === 'video' ? (
              <video src={media.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No media</div>
          )}
          <span className={`absolute top-2 left-2 ${pillColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
            {hat.hat_type || (isTalent ? 'Talent' : 'Client')}
          </span>
          {hat.availability && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Available" />
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-[1.5px] border-black overflow-hidden bg-gray-200 shrink-0">
              {hat.owner_avatar || hat.avatar_url ? (
                <img src={hat.owner_avatar || hat.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {(hat.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {hat.username}
                {hat.is_verified && <span className="ml-1 text-[#0A13E6]" title="Verified">✓</span>}
              </p>
              <p className="text-xs text-gray-500 truncate">{hat.hat_title}</p>
            </div>
          </div>
          {motto && <p className="text-xs text-gray-600 line-clamp-2">{motto}</p>}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {hat.lga && (
              <span className="flex items-center gap-0.5">
                <MapPin size={12} /> {hat.lga}
              </span>
            )}
            {hat.orbit && <span className="truncate">{hat.orbit}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="font-semibold text-sm">{fmt(hat.price_min || hat.rate)}</span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-0.5">
                <Star size={12} className="text-amber-400" /> {Number(hat.rating || 0).toFixed(1)}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart size={12} /> {hat.likes || 0}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={`mt-2 w-full py-2 rounded-xl text-sm font-medium text-white ${isTalent ? 'bg-[#0A13E6] hover:bg-[#080fb8]' : 'bg-black hover:bg-gray-800'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (isTalent) onBook?.(hat)
              else onApply?.(hat)
            }}
          >
            {isTalent ? 'Book' : 'Apply'}
          </button>
        </div>
      </article>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-panel bg-white rounded-2xl w-[96%] max-w-[1150px] max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-gray-100 min-h-[240px]">
                {media?.url ? (
                  media.type === 'video' ? (
                    <video src={media.url} controls className="w-full h-full object-contain max-h-[70vh]" />
                  ) : (
                    <img src={media.url} alt="" className="w-full h-full object-contain max-h-[70vh]" />
                  )
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">No portfolio</div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-[1.5px] border-black overflow-hidden bg-gray-200">
                    {(hat.owner_avatar || hat.avatar_url) && (
                      <img src={hat.owner_avatar || hat.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-1">
                      {hat.username}
                      {hat.is_verified && <span className="text-[#0A13E6]">✓</span>}
                    </h2>
                    <p className="text-gray-600">{hat.hat_title}</p>
                  </div>
                </div>
                {hat.motto && <p className="text-sm text-gray-700">{hat.motto}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`${pillColor} text-white px-2 py-1 rounded-full`}>{hat.hat_type}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full">{hat.orbit}</span>
                  {hat.lga && <span className="bg-gray-100 px-2 py-1 rounded-full">{hat.lga}</span>}
                </div>
                {hat.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hat.skills.map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-lg font-semibold">{fmt(hat.price_min)} – {fmt(hat.price_max || hat.price_min)}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 ${isTalent ? 'bg-[#0A13E6]' : 'bg-black'}`}
                    onClick={() => (isTalent ? onBook?.(hat) : onApply?.(hat))}
                  >
                    {isTalent ? <BookOpen size={16} /> : <Send size={16} />}
                    {isTalent ? 'Book Talent' : 'Apply'}
                  </button>
                </div>
                <EscrowBadge hat={hat} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EscrowBadge({ hat, escrow }) {
  // Placeholder until real escrow state is passed
  const funded = escrow?.status === 'secured' || escrow?.status === 'released'
  if (funded) {
    return (
      <div className="escrow-secured inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-200">
        ₦{(escrow?.amount || hat.price_min || 0).toLocaleString()} Secured • Contacts Unlocked 🔓
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 text-sm font-medium border border-blue-200">
      Escrow: Not Funded • Contacts Locked 🔒
    </div>
  )
}
