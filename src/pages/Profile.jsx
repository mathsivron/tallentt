import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border p-6 shadow-sm space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-black bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
          {(user.username || user.fullName || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user.fullName}</p>
          <p className="text-gray-500">@{user.username}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Country</dt>
          <dd className="font-medium">{user.country || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">LGA</dt>
          <dd className="font-medium">{user.lga || '—'}</dd>
        </div>
      </dl>
      <Link to="/my-hats" className="inline-block mt-2 text-[#0A13E6] font-medium text-sm">
        Manage my hats →
      </Link>
    </div>
  )
}
