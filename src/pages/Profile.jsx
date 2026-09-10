import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

  const initials = (user.fullName || user.username || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-[480px] mx-auto bg-white rounded-[24px] border-[1.5px] border-black p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] space-y-5">
      <h1 className="text-[20px] font-bold tracking-tight">Profile</h1>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-black bg-black text-white flex items-center justify-center text-[18px] font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[16px] leading-tight">{user.fullName}</p>
          <p className="text-[13px] text-black/50">@{user.username}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {[
          ['Email', user.email],
          ['Role', user.role],
          ['Country', user.country || '—'],
          ['LGA', user.lga || '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-[#F5F3EF] border border-black/5 p-3">
            <dt className="text-[10px] font-bold tracking-widest uppercase text-black/40">{label}</dt>
            <dd className="font-semibold text-[13px] mt-0.5 capitalize">{value}</dd>
          </div>
        ))}
      </dl>

      <Link
        to="/my-hats"
        className="inline-flex h-11 px-5 rounded-full bg-[#0A13E6] text-white text-[13px] font-semibold border-[1.5px] border-black items-center shadow-[0_4px_12px_rgba(10,19,230,0.25)] hover:bg-black transition"
      >
        Manage my hats →
      </Link>
    </div>
  )
}
