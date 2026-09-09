import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 560, margin: '80px auto', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 24px' }}>
      <h1 style={{ letterSpacing: '-0.03em' }}>You're signed in 👋</h1>
      <p style={{ color: '#6d7080' }}>
        This is a placeholder workspace — everything past authentication (Hats, Showroom, escrow)
        isn't built yet.
      </p>
      <div
        style={{
          border: '1px solid #e8e9ef',
          borderRadius: 14,
          padding: 16,
          margin: '24px 0',
          background: '#fafafa',
        }}
      >
        <b>{user.fullName}</b> · @{user.username}
        <br />
        <span style={{ color: '#6d7080', fontSize: 13 }}>
          {user.email} · {user.lga}, {user.country} · {user.role} account
        </span>
      </div>
      <button
        onClick={logout}
        style={{
          border: 0,
          background: '#0a13e6',
          color: '#fff',
          borderRadius: 12,
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        Sign out
      </button>
    </div>
  )
}
