import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import '../styles/auth.css'

const CATEGORIES = [
  'Music',
  'Dance',
  'Comedy',
  'Fashion',
  'Acting',
  'Modeling',
  'Art & Design',
  'Writing',
  'Photography',
  'Content Creation',
  'Sports',
  'Other',
]

const LEGAL = {
  terms: {
    title: 'Terms of Service',
    body: 'ChombuTar provides a marketplace for talent to showcase skills and for clients to discover and book them. You must be 18+ or have guardian consent. You own your content. Escrow funds are released in full to talent on confirmed delivery — ChombuTar takes no platform fee in this phase.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'We store account details (name, username, email, role, location) to operate the marketplace. We do not sell your personal data. Session cookies are httpOnly JWTs. You may request account deletion by contacting support.',
  },
  vendor: {
    title: 'Vendor Affiliate Agreement',
    body: 'As a talent or vendor affiliate you agree not to copy others’ products, not to spam, and to accurately represent your work. Affiliate earnings linked to your talent are paid 100% to you in this phase (no platform commission). Violations may result in suspension.',
  },
  cookie: {
    title: 'Cookie Policy',
    body: 'We use essential session cookies to keep you signed in. We do not use third-party advertising cookies in this build.',
  },
}

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('signup') // signup | login
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [legalKey, setLegalKey] = useState(null)
  const [socialNote, setSocialNote] = useState(null)

  // Signup
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [userStatus, setUserStatus] = useState(null) // checking | available | taken | invalid
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Login
  const [loginId, setLoginId] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)

  const debounceRef = useRef(null)

  useEffect(() => {
    const u = username.trim().replace(/^@/, '')
    if (!u) {
      setUserStatus(null)
      return
    }
    setUserStatus('checking')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.usernameCheck(u)
        setUserStatus(data.status)
      } catch {
        setUserStatus('invalid')
      }
    }, 600)
    return () => clearTimeout(debounceRef.current)
  }, [username])

  function switchMode(next) {
    setMode(next)
    setError('')
    setSuccess('')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const u = username.trim().replace(/^@/, '')
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    if (userStatus !== 'available') {
      setError(userStatus === 'taken' ? 'That username is taken.' : 'Choose an available username.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!category) {
      setError('Select a talent category.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setError('You must agree to the Affiliate Marketing Terms and Vendor Affiliate Agreement.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        fullName: fullName.trim(),
        username: u,
        email: email.trim(),
        password,
        role: 'dual',
        country: 'Nigeria',
        lga: category, // store category until dedicated column exists
      })
      setSuccess('Welcome — Your spotlight is live')
      setTimeout(() => navigate('/', { replace: true }), 900)
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!loginId.trim() || !loginPass) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    try {
      await login({ email: loginId.trim(), password: loginPass })
      setSuccess('Welcome back — you are signed in.')
      setTimeout(() => navigate('/', { replace: true }), 700)
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="v9-shell">
      <div className="v9-logo" aria-label="ChombuTar">
        <div className="v9-logo-circle" aria-hidden>
          <div className="v9-logo-arrow" />
        </div>
        <div className="v9-logo-word">
          Talent<span className="script-w">W</span>orld
        </div>
        <div className="v9-logo-tag">Own Your Spotlight</div>
      </div>

      <div className="v9-card">
        <div className="v9-card-inner">
          <div className="v9-switch" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
          </div>

          {success && <div className="v9-success-banner">{success}</div>}
          {error && <div className="v9-error">{error}</div>}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} noValidate>
              <h1 className="v9-title">Create your spotlight</h1>
              <p className="v9-sub">Join ChombuTar and own your stage.</p>

              <div className="v9-field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="v9-field">
                <label htmlFor="username">Username</label>
                <div className="v9-username">
                  <span className="prefix">@</span>
                  <input
                    id="username"
                    placeholder="amara_dance"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    required
                  />
                  {userStatus && (
                    <span className={`v9-pill ${userStatus}`}>
                      {userStatus === 'checking' && 'Checking...'}
                      {userStatus === 'available' && 'Available'}
                      {userStatus === 'taken' && 'Taken'}
                      {userStatus === 'invalid' && 'Invalid'}
                    </span>
                  )}
                </div>
              </div>

              <div className="v9-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="v9-field">
                <label htmlFor="category">Talent category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="v9-field">
                <label htmlFor="password">Password</label>
                <div className="v9-pass-wrap">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" className="eye" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="v9-field">
                <label htmlFor="confirm">Confirm password</label>
                <div className="v9-pass-wrap">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" className="eye" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle confirm password">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              <label className="v9-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>
                  I agree to{' '}
                  <a href="#vendor" onClick={(e) => { e.preventDefault(); setLegalKey('vendor') }}>
                    Affiliate Marketing Terms
                  </a>{' '}
                  and{' '}
                  <a href="#vendor" onClick={(e) => { e.preventDefault(); setLegalKey('vendor') }}>
                    Vendor Affiliate Agreement
                  </a>
                  . I will not copy products or use spam.
                </span>
              </label>

              <button className="v9-cta" type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Account — Own Your Spotlight'}
              </button>

              <p className="v9-helper">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}>
                  Login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} noValidate>
              <h1 className="v9-title">Welcome back</h1>
              <p className="v9-sub">Own your spotlight. Sign in to continue.</p>

              <div className="v9-field">
                <label htmlFor="loginEmail">Email</label>
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </div>

              <div className="v9-field">
                <label htmlFor="loginPassword">Password</label>
                <div className="v9-pass-wrap">
                  <input
                    id="loginPassword"
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                  />
                  <button type="button" className="eye" onClick={() => setShowLoginPass((v) => !v)} aria-label="Toggle password">
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="v9-forgot">
                <button type="button" onClick={() => setSocialNote('Password reset is coming soon. Contact support if locked out.')}>
                  Forgot password?
                </button>
              </div>

              <button className="v9-cta" type="submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Login — Own Your Spotlight'}
              </button>

              <div className="v9-or">Or continue with</div>
              <div className="v9-social">
                <button type="button" onClick={() => setSocialNote('Google sign-in is coming soon.')}>
                  <span style={{ color: '#4285f4', fontWeight: 900 }}>G</span> Google
                </button>
                <button type="button" onClick={() => setSocialNote('Apple sign-in is coming soon.')}>
                  <span aria-hidden></span> Apple
                </button>
              </div>

              <p className="v9-helper">
                New to ChombuTar?{' '}
                <button type="button" onClick={() => switchMode('signup')}>
                  Create account
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="v9-card-footer">
          <button type="button" onClick={() => setLegalKey('terms')}>Terms of Service</button>
          <button type="button" onClick={() => setLegalKey('privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => setLegalKey('vendor')}>Vendor Affiliate Agreement</button>
          <button type="button" onClick={() => setLegalKey('cookie')}>Cookie Policy</button>
        </div>
      </div>

      <p className="v9-outside-footer">© 2026 ChombuTar • Own Your Spotlight • signup V9</p>

      {legalKey && LEGAL[legalKey] && (
        <div className="v9-modal-overlay" role="dialog" aria-modal="true" onClick={() => setLegalKey(null)}>
          <div className="v9-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{LEGAL[legalKey].title}</h3>
            <p>{LEGAL[legalKey].body}</p>
            <div className="close-row">
              <button type="button" onClick={() => setLegalKey(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {socialNote && (
        <div className="v9-modal-overlay" role="dialog" aria-modal="true" onClick={() => setSocialNote(null)}>
          <div className="v9-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Coming soon</h3>
            <p>{socialNote}</p>
            <div className="close-row">
              <button type="button" onClick={() => setSocialNote(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
