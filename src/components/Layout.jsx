import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, Store, UserRound, PlusCircle, LogOut, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [browseRole, setBrowseRole] = useState(() => localStorage.getItem('talentworld_role') || 'creator')

  useEffect(() => {
    localStorage.setItem('talentworld_role', browseRole)
  }, [browseRole])

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  const helper =
    browseRole === 'creator'
      ? 'You are browsing as Creator → viewing Client cards'
      : 'You are browsing as Employer → viewing Talent cards'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-lg text-[#0A13E6] tracking-tight">
            TWORLD
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavItem to="/" icon={Home} label="Feed" />
            <NavItem to="/showroom" icon={Store} label="Showroom" />
            <NavItem to="/my-hats" icon={Briefcase} label="My Hats" />
            <NavItem to="/create" icon={PlusCircle} label="Create" />
            <NavItem to="/profile" icon={UserRound} label="Profile" />
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-gray-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBrowseRole('creator')}
                className={`px-3 py-1 rounded-full transition ${browseRole === 'creator' ? 'bg-[#0A13E6] text-white' : ''}`}
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => setBrowseRole('employer')}
                className={`px-3 py-1 rounded-full transition ${browseRole === 'employer' ? 'bg-black text-white' : ''}`}
              >
                Employer
              </button>
            </div>
            <button type="button" onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 pb-2 px-4">{helper}</p>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 z-40">
        <NavItem to="/" icon={Home} label="Feed" mobile />
        <NavItem to="/showroom" icon={Store} label="Showroom" mobile />
        <NavItem to="/create" icon={PlusCircle} label="Create" mobile />
        <NavItem to="/my-hats" icon={Briefcase} label="Hats" mobile />
        <NavItem to="/profile" icon={UserRound} label="Profile" mobile />
      </nav>
      <div className="sm:hidden h-16" />
    </div>
  )
}

function NavItem({ to, icon: Icon, label, mobile }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex ${mobile ? 'flex-col items-center gap-0.5 text-[10px]' : 'items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm'} ${
          isActive ? 'text-[#0A13E6] font-semibold' : 'text-gray-600'
        }`
      }
    >
      <Icon size={mobile ? 20 : 16} />
      {label}
    </NavLink>
  )
}

export function useBrowseRole() {
  const [role, setRole] = useState(() => localStorage.getItem('talentworld_role') || 'creator')
  useEffect(() => {
    const onStorage = () => setRole(localStorage.getItem('talentworld_role') || 'creator')
    window.addEventListener('storage', onStorage)
    const id = setInterval(onStorage, 500)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(id)
    }
  }, [])
  return role
}
