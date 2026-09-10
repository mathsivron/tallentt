import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, X, Sparkles } from 'lucide-react'
import { api, uploadToCloudinary } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const COUNTRIES = [
  { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
]

const HAT_TYPES = ['Freelance', 'Contract', 'Full-time']

const DEFAULT_ORBITS = [
  'Music & Audio', 'Visual Arts & Design', 'Performing Arts', 'Community & Care',
  'Beauty', 'Event Buyer', 'Models', 'Actors', 'Musicians', 'Creators', 'Developers',
]

export default function HatForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const { user } = useAuth()

  const [role, setRole] = useState('talent')
  const [hatTitle, setHatTitle] = useState('')
  const [username, setUsername] = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [orbit, setOrbit] = useState('')
  const [customOrbit, setCustomOrbit] = useState('')
  const [skills, setSkills] = useState('')
  const [hatType, setHatType] = useState('Freelance')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [lga, setLga] = useState('')
  const [motto, setMotto] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [rate, setRate] = useState('')
  const [media, setMedia] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [portfolioError, setPortfolioError] = useState(false)
  const [orbits, setOrbits] = useState(DEFAULT_ORBITS)

  useEffect(() => {
    api.getOrbits()
      .then((d) => {
        if (d.orbits?.length) setOrbits(d.orbits.map((o) => o.name))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!editId) return
    api
      .getHat(editId)
      .then(({ hat }) => {
        setRole(hat.role || 'talent')
        setHatTitle(hat.hat_title || '')
        setUsername(hat.username || '')
        setVerifiedName(hat.verified_name || '')
        setOrbit(hat.orbit || '')
        setSkills((hat.skills || []).join(', '))
        setHatType(hat.hat_type || 'Freelance')
        const c = COUNTRIES.find((x) => x.name === hat.country) || COUNTRIES[0]
        setCountry(c)
        setLga(hat.lga || '')
        setMotto(hat.motto || '')
        setPriceMin(String(hat.price_min ?? ''))
        setPriceMax(hat.price_max != null ? String(hat.price_max) : '')
        setRate(hat.rate != null ? String(hat.rate) : '')
        setMedia(hat.media || [])
      })
      .catch((e) => setError(e.message))
  }, [editId])

  async function onFile(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setPortfolioError(false)
    try {
      const uploaded = []
      for (const f of files) {
        const m = await uploadToCloudinary(f)
        uploaded.push(m)
      }
      setMedia((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeMedia(idx) {
    setMedia((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (role === 'talent' && media.length === 0) {
      setPortfolioError(true)
      setError('Portfolio file is required for Talent hats')
      return
    }
    const finalOrbit = customOrbit.trim() || orbit
    if (!finalOrbit) {
      setError('Select or enter an orbit')
      return
    }
    setSubmitting(true)
    try {
      if (customOrbit.trim() && !orbits.includes(customOrbit.trim())) {
        await api.createOrbit(customOrbit.trim()).catch(() => {})
      }
      const body = {
        hat_title: hatTitle,
        // username is bound server-side from the signed-in user
        verified_name: verifiedName || undefined,
        orbit: finalOrbit,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        hat_type: hatType,
        country: country.name,
        country_flag: country.flag,
        currency: country.currency,
        lga,
        motto: motto.slice(0, 80),
        price_min: Number(priceMin) || 0,
        price_max: priceMax ? Number(priceMax) : undefined,
        rate: rate ? Number(rate) : undefined,
        role,
        media,
        availability: true,
      }
      if (editId) await api.updateHat(editId, body)
      else await api.createHat(body)
      navigate('/my-hats')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-[520px] mx-auto space-y-5 bg-white rounded-[24px] border-[1.5px] border-black p-5 md:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      <div>
        <h1 className="text-[20px] font-bold tracking-tight">{editId ? 'Edit Hat' : 'Create Hat'}</h1>
        <p className="text-[12px] text-black/50 mt-0.5 font-medium">A hat is a talent listing under your account · Orbit score = confidence</p>
      </div>

      {/* Role toggle */}
      <div className="flex gap-2 p-1 rounded-full bg-[#F5F3EF] border-[1.5px] border-black">
        {['talent', 'client'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRole(r)
              setPortfolioError(false)
            }}
            className={`flex-1 h-10 rounded-full text-[13px] font-semibold capitalize transition ${
              role === r
                ? r === 'talent'
                  ? 'bg-[#0A13E6] text-white border-[1.5px] border-black shadow'
                  : 'bg-black text-white border-[1.5px] border-black shadow'
                : 'text-black/50 hover:text-black'
            }`}
          >
            {r === 'talent' ? 'Talent hat' : 'Client hat'}
          </button>
        ))}
      </div>

      <Field label="Hat title" required>
        <input className="tw-input" value={hatTitle} onChange={(e) => setHatTitle(e.target.value)} required placeholder="e.g. UI Designer for SaaS" />
      </Field>

      <div className="rounded-[14px] border-[1.5px] border-black/10 bg-[#F5F3EF] px-4 py-3">
        <div className="tw-label mb-1">Account</div>
        <p className="text-[14px] font-semibold">
          @{user?.username || username || '…'}
          <span className="ml-2 text-[11px] font-medium text-black/40 normal-case tracking-normal">
            from your signed-in profile — not editable per hat
          </span>
        </p>
      </div>

      <Field label="Verified name (optional)">
        <input
          className="tw-input"
          value={verifiedName}
          onChange={(e) => setVerifiedName(e.target.value)}
          placeholder="e.g. Acme Studios Ltd"
        />
        <p className="text-[10px] text-black/40 mt-1.5 font-medium">
          Ends with Ltd / Plc / Corp / Inc / LLC → verified badge
        </p>
      </Field>

      <Field label="Orbit" required>
        <select
          className="tw-input appearance-none"
          value={orbit}
          onChange={(e) => {
            setOrbit(e.target.value)
            setCustomOrbit('')
          }}
        >
          <option value="">Select orbit…</option>
          {orbits.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          className="tw-input mt-2"
          placeholder="Or type custom orbit"
          value={customOrbit}
          onChange={(e) => setCustomOrbit(e.target.value)}
        />
      </Field>

      <Field label="Skills (comma-separated)">
        <input className="tw-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Figma, Voice-over" />
      </Field>

      <Field label="Hat type">
        <select className="tw-input appearance-none" value={hatType} onChange={(e) => setHatType(e.target.value)}>
          {HAT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <select
            className="tw-input appearance-none"
            value={country.name}
            onChange={(e) => setCountry(COUNTRIES.find((c) => c.name === e.target.value) || COUNTRIES[0])}
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="LGA / City">
          <input className="tw-input" value={lga} onChange={(e) => setLga(e.target.value)} placeholder="Yaba" />
        </Field>
      </div>

      <Field label={`Motto (${motto.length}/80)`}>
        <textarea
          className="tw-input min-h-[88px] resize-none"
          maxLength={80}
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          placeholder="e.g. Rhythm lives in every heartbeat I play."
        />
        <div className="flex items-center gap-1.5 mt-1.5">
          <Sparkles size={12} className="text-violet-600" />
          <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">AI-assisted suggestions coming</span>
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Price min *" required>
          <input type="number" min="0" className="tw-input" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} required placeholder="50000" />
        </Field>
        <Field label="Price max">
          <input type="number" min="0" className="tw-input" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="120000" />
        </Field>
        <Field label="Rate">
          <input type="number" min="0" className="tw-input" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="/hr" />
        </Field>
      </div>
      <p className="text-[10px] font-medium text-black/40 -mt-3">
        Currency: {country.flag} {country.currency} · Escrow = price min
      </p>

      {/* Portfolio upload — DECISION #3 */}
      <div className="space-y-2">
        <label className="tw-label flex items-center gap-2 flex-wrap">
          {role === 'talent' ? (
            <>
              Upload File *
              <span className="normal-case font-semibold text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                Required for Talent
              </span>
            </>
          ) : (
            <>
              Upload File
              <span className="normal-case font-medium text-[10px] px-2 py-0.5 rounded-full bg-[#f2f2f1] border border-black/10 text-black/60">
                Optional for Client
              </span>
            </>
          )}
        </label>
        <p className={`text-[10px] font-medium px-0.5 ${portfolioError ? 'text-red-600 font-semibold' : 'text-black/50'}`}>
          {role === 'talent'
            ? 'Portfolio file is required for Talent hats — showcase your work (image, video, audio).'
            : 'For clients, file upload is optional — add reference material if needed.'}
        </p>

        <div
          className={`rounded-[16px] border-[1.5px] border-dashed p-4 transition ${
            portfolioError
              ? 'border-red-400 ring-4 ring-red-100 bg-red-50/30'
              : 'border-black/15 bg-[#F5F3EF]/50'
          }`}
        >
          <label className="flex flex-col items-center gap-2 cursor-pointer py-2">
            <div className="w-10 h-10 rounded-full bg-white border-[1.5px] border-black flex items-center justify-center">
              <Upload size={18} />
            </div>
            <span className="text-[12px] font-semibold text-black/70">
              {uploading ? 'Uploading…' : 'Upload image / video / audio'}
            </span>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              className="hidden"
              onChange={onFile}
              disabled={uploading}
            />
          </label>

          {media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div
                  key={m.public_id || i}
                  className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-white border-[1.5px] border-black/10"
                >
                  {m.type === 'image' || !m.type ? (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase text-black/40">
                      {m.type}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[12px] border-[1.5px] border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting || uploading} className="tw-btn-primary w-full disabled:opacity-60">
        {submitting ? 'Saving…' : editId ? 'Update Hat' : 'Create Hat'}
      </button>
    </form>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="tw-label">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </span>
      {children}
    </label>
  )
}
