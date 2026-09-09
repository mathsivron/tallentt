import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/auth.css'

const ROLE_TITLES = { talent: 'Talent', client: 'Client', dual: 'Dual' }

const STEP_META = {
  signIn: { step: 'Welcome back', progress: 0, showProgress: false },
  role: { step: 'Step 1 of 2', progress: 48, showProgress: true },
  details: { step: 'Step 2 of 2', progress: 100, showProgress: true },
  complete: { step: 'Account created', progress: 100, showProgress: true },
}

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('signIn')
  const [selectedRole, setSelectedRole] = useState('dual')
  const [submitting, setSubmitting] = useState(false)

  const [signInForm, setSignInForm] = useState({ email: '', password: '' })
  const [signInError, setSignInError] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  const [detailsForm, setDetailsForm] = useState({
    fullName: '',
    username: '',
    email: '',
    country: '',
    lga: '',
    password: '',
  })
  const [detailsError, setDetailsError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)

  // Signup policy popup — shown after the details form validates, before the
  // account is actually created. Disagreeing cancels the signup entirely.
  const [showPolicy, setShowPolicy] = useState(false)
  const [policyError, setPolicyError] = useState('')

  const meta = STEP_META[view]

  async function handleSignIn(e) {
    e.preventDefault()
    setSignInError('')
    setSubmitting(true)
    try {
      await login({ email: signInForm.email.trim(), password: signInForm.password })
      navigate('/', { replace: true })
    } catch (err) {
      setSignInError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDetailsSubmit(e) {
    e.preventDefault()
    setDetailsError('')

    const username = detailsForm.username.trim().replace(/^@/, '')
    if (!/^[A-Za-z0-9._-]{3,}$/.test(username)) {
      setDetailsError('Username must be at least 3 characters (letters, numbers, dots, dashes, underscores).')
      return
    }
    if (detailsForm.password.length < 8) {
      setDetailsError('Password must be at least 8 characters.')
      return
    }

    // Details are valid — show the signup policy before actually creating the account.
    setPolicyError('')
    setShowPolicy(true)
  }

  async function handlePolicyAgree() {
    setPolicyError('')
    setSubmitting(true)
    try {
      const username = detailsForm.username.trim().replace(/^@/, '')
      const user = await register({
        fullName: detailsForm.fullName.trim(),
        username,
        email: detailsForm.email.trim(),
        country: detailsForm.country,
        lga: detailsForm.lga.trim(),
        password: detailsForm.password,
        role: selectedRole,
      })
      setShowPolicy(false)
      setCreatedUser(user)
      setView('complete')
    } catch (err) {
      // Keep the modal open and surface the error there, so the person doesn't
      // lose the fact that they already agreed.
      setPolicyError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handlePolicyDisagree() {
    setShowPolicy(false)
    setPolicyError('')
    setDetailsError('You need to agree to the signup policy to create a TalentWorld account.')
  }

  return (
    <main className="shell">
      <aside className="brand-panel">
        <div className="logo">
          <span className="logo-mark">T</span>TalentWorld
        </div>
        <section className="hero">
          <div className="eyebrow">Built for how work really works</div>
          <h1>Own your spotlight.</h1>
          <p>
            One account to create, hire, and grow. Move between your Talent and Client worlds
            whenever you need to.
          </p>
          <div className="role-preview">
            <div className="preview-card">
              <b>✦ Talent</b>
              <span>Show your craft. Find work.</span>
            </div>
            <div className="preview-card">
              <b>▣ Client</b>
              <span>Find talent. Build teams.</span>
            </div>
          </div>
        </section>
        <div className="trust">
          <span className="dot" /> Secure profiles and escrow-ready workspaces
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth">
          <div className="auth-top">
            <div className="tiny-logo">TalentWorld</div>
            <div className="step">{meta.step}</div>
          </div>

          {meta.showProgress && (
            <div className="progress">
              <b style={{ width: `${meta.progress}%` }} />
            </div>
          )}

          {view === 'signIn' && (
            <div className="form-view active">
              <h2>Welcome back.</h2>
              <p className="sub">Sign in to pick up where you left off.</p>
              <div className={`error ${signInError ? 'active' : ''}`}>{signInError}</div>
              <form onSubmit={handleSignIn}>
                <div className="field">
                  <label htmlFor="loginEmail">Email address</label>
                  <input
                    required
                    id="loginEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="field password">
                  <label htmlFor="loginPassword">Password</label>
                  <input
                    required
                    id="loginPassword"
                    type={showSignInPassword ? 'text' : 'password'}
                    minLength={8}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowSignInPassword((v) => !v)}>
                    {showSignInPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button className="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in to TalentWorld'}
                </button>
              </form>
              <p className="terms">
                New to TalentWorld?{' '}
                <button className="link" type="button" onClick={() => setView('role')}>
                  Create your account
                </button>
              </p>
            </div>
          )}

          {view === 'role' && (
            <div className="form-view active">
              <h2>
                How will you use
                <br />
                TalentWorld?
              </h2>
              <p className="sub">
                Choose your starting role. A Dual account gives you both worlds from day one.
              </p>
              <div className="roles">
                <button
                  type="button"
                  className={`role ${selectedRole === 'talent' ? 'selected' : ''}`}
                  onClick={() => setSelectedRole('talent')}
                >
                  <span className="icon">✦</span>
                  <b>Talent</b>
                  <small>I want to showcase my skills and find work.</small>
                  <i className="check">✓</i>
                </button>
                <button
                  type="button"
                  className={`role ${selectedRole === 'client' ? 'selected' : ''}`}
                  onClick={() => setSelectedRole('client')}
                >
                  <span className="icon">▣</span>
                  <b>Client</b>
                  <small>I want to find talent and post opportunities.</small>
                  <i className="check">✓</i>
                </button>
                <button
                  type="button"
                  className={`role dual ${selectedRole === 'dual' ? 'selected' : ''}`}
                  onClick={() => setSelectedRole('dual')}
                >
                  <span className="icon">◈</span>
                  <span>
                    <b>Dual account</b>
                    <small>Work as Talent and hire as Client with the same account.</small>
                  </span>
                  <i className="check">✓</i>
                </button>
              </div>
              <div className="note">
                <span>↔</span>
                <span>
                  <b>You can switch anytime.</b> Your browsing role is saved so your feed always
                  opens the way you last used it.
                </span>
              </div>
              <button className="primary" type="button" onClick={() => setView('details')}>
                Continue
              </button>
              <p className="terms">
                Already have an account?{' '}
                <button className="link" type="button" onClick={() => setView('signIn')}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'details' && (
            <div className="form-view active">
              <h2>Make it yours.</h2>
              <p className="sub">Set up your secure TalentWorld account.</p>
              <div className={`error ${detailsError ? 'active' : ''}`}>{detailsError}</div>
              <form onSubmit={handleDetailsSubmit}>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="fullName">Full name</label>
                    <input
                      required
                      id="fullName"
                      autoComplete="name"
                      placeholder="Your name"
                      value={detailsForm.fullName}
                      onChange={(e) => setDetailsForm((f) => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="username">Username</label>
                    <input
                      required
                      id="username"
                      placeholder="@yourname"
                      value={detailsForm.username}
                      onChange={(e) => setDetailsForm((f) => ({ ...f, username: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    required
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={detailsForm.email}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="country">Country</label>
                    <select
                      required
                      id="country"
                      value={detailsForm.country}
                      onChange={(e) => setDetailsForm((f) => ({ ...f, country: e.target.value }))}
                    >
                      <option value="">Select country</option>
                      <option>Nigeria</option>
                      <option>Ghana</option>
                      <option>Kenya</option>
                      <option>United Kingdom</option>
                      <option>United States</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="lga">City / LGA</label>
                    <input
                      required
                      id="lga"
                      placeholder="e.g. Yaba"
                      value={detailsForm.lga}
                      onChange={(e) => setDetailsForm((f) => ({ ...f, lga: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="field password">
                  <label htmlFor="newPassword">Create password</label>
                  <input
                    required
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={detailsForm.password}
                    onChange={(e) => setDetailsForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowNewPassword((v) => !v)}>
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="note">
                  <span>🔒</span>
                  <span>
                    Your profile is protected. You will choose a <b>Talent or Client hat</b>{' '}
                    after creating your account.
                  </span>
                </div>
                <button className="primary" type="submit" disabled={submitting}>
                  Continue to signup policy
                </button>
              </form>
              <button className="back" type="button" onClick={() => setView('role')}>
                ← Back to role selection
              </button>
            </div>
          )}

          {view === 'complete' && createdUser && (
            <div className="form-view active">
              <div className="success active">
                <div className="success-ring">✓</div>
                <h2>You are in.</h2>
                <p className="sub">
                  Your {ROLE_TITLES[createdUser.role] ?? 'Dual'} account is ready. Choose which
                  world to explore first.
                </p>
                <div className="account-card">
                  <b>
                    {createdUser.fullName} · @{createdUser.username}
                  </b>
                  <span>
                    {createdUser.lga}, {createdUser.country} · {ROLE_TITLES[createdUser.role] ?? 'Dual'}{' '}
                    account
                  </span>
                </div>
                <button className="primary" type="button" onClick={() => navigate('/', { replace: true })}>
                  Go to my workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {showPolicy && (
        <div className="policy-overlay" role="dialog" aria-modal="true" aria-labelledby="policyTitle">
          <div className="policy-modal">
            <h3 id="policyTitle">TalentWorld signup policy</h3>
            <div className="policy-body">
              <p>Before you create your account, please review and agree to the following:</p>
              <ul>
                <li>
                  <b>Escrow &amp; payments.</b> Funds you send to secure a booking are held until you
                  confirm delivery, then released in full to the Talent — TalentWorld does not take a
                  fee.
                </li>
                <li>
                  <b>Keep contact off-platform sharing to a minimum before booking.</b> Messages that
                  try to move a conversation off TalentWorld before a booking is secured (phone
                  numbers, WhatsApp, "DM me", etc.) may be automatically masked.
                </li>
                <li>
                  <b>Honesty in your profile.</b> Your hat title, verification claims, and portfolio
                  must accurately represent your work.
                </li>
                <li>
                  <b>Respectful conduct.</b> Harassment, discrimination, or abusive behaviour toward
                  other members is not tolerated and may result in account removal.
                </li>
                <li>
                  <b>Data use.</b> We store your profile details to operate TalentWorld's marketplace
                  features (discovery, bookings, escrow) and will not sell your data to third parties.
                </li>
              </ul>
            </div>
            {policyError && <div className="error active">{policyError}</div>}
            <div className="policy-actions">
              <button type="button" className="policy-disagree" onClick={handlePolicyDisagree} disabled={submitting}>
                Disagree
              </button>
              <button type="button" className="policy-agree" onClick={handlePolicyAgree} disabled={submitting}>
                {submitting ? 'Creating account…' : 'Agree & create account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
