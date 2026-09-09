import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { api, uploadToCloudinary } from '../lib/api'

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
    api.getOrbits().then((d) => {
      if (d.orbits?.length) setOrbits(d.orbits.map((o) => o.name))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!editId) return
    api.getHat(editId).then(({ hat }) => {
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
    }).catch((e) => setError(e.message))
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
        username,
        verified_name: verifiedName || undefined,
        orbit: finalOrbit,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
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
    <form onSubmit={onSubmit} className="max-w-xl mx-auto space-y-5 bg-white rounded-2xl border p-6 shadow-sm">
      <h1 className="text-xl font-bold">{editId ? 'Edit Hat' : 'Create Hat'}</h1>

      <div className="flex gap-2">
        {['talent', 'client'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${
              role === r ? (r === 'talent' ? 'bg-[#0A13E6] text-white' : 'bg-black text-white') : 'bg-gray-100'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Field label="Hat title" required>
        <input className="input" value={hatTitle} onChange={(e) => setHatTitle(e.target.value)} required />
      </Field>
      <Field label="Username" required>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </Field>
      <Field label="Verified name (optional — ends with Ltd/Plc/Corp/Inc/LLC for badge)">
        <input className="input" value={verifiedName} onChange={(e) => setVerifiedName(e.target.value)} placeholder="e.g. Acme Studios Ltd" />
      </Field>

      <Field label="Orbit" required>
        <select className="input" value={orbit} onChange={(e) => { setOrbit(e.target.value); setCustomOrbit('') }}>
          <option value="">Select orbit…</option>
          {orbits.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input
          className="input mt-2"
          placeholder="Or type custom orbit"
          value={customOrbit}
          onChange={(e) => setCustomOrbit(e.target.value)}
        />
      </Field>

      <Field label="Skills (comma-separated)">
        <input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Figma, Voice-over" />
      </Field>

      <Field label="Hat type">
        <select className="input" value={hatType} onChange={(e) => setHatType(e.target.value)}>
          {HAT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <select
            className="input"
            value={country.name}
            onChange={(e) => setCountry(COUNTRIES.find((c) => c.name === e.target.value) || COUNTRIES[0])}
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="LGA / City">
          <input className="input" value={lga} onChange={(e) => setLga(e.target.value)} />
        </Field>
      </div>

      <Field label={`Motto (${motto.length}/80)`}>
        <textarea
          className="input min-h-[72px]"
          maxLength={80}
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Price min (₦)" required>
          <input type="number" min="0" className="input" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} required />
        </Field>
        <Field label="Price max">
          <input type="number" min="0" className="input" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </Field>
        <Field label="Rate">
          <input type="number" min="0" className="input" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>

      <Field
        label={
          role === 'talent'
            ? 'Portfolio (required for Talent)'
            : 'Portfolio (optional for Client)'
        }
      >
        <div className={`border-2 border-dashed rounded-xl p-4 ${portfolioError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'}`}>
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600">{uploading ? 'Uploading…' : 'Upload image / video / audio'}</span>
            <input type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={onFile} disabled={uploading} />
          </label>
          {media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div key={m.public_id || i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  {m.type === 'image' || !m.type ? (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase">{m.type}</div>
                  )}
                  <button type="button" onClick={() => removeMedia(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded text-white">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {portfolioError && <p className="text-red-600 text-xs mt-2">Portfolio file is required for Talent hats</p>}
          {role === 'client' && <p className="text-xs text-gray-500 mt-2">For clients, file upload is optional</p>}
        </div>
      </Field>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full py-3 rounded-xl bg-[#0A13E6] text-white font-semibold hover:bg-[#080fb8] disabled:opacity-60"
      >
        {submitting ? 'Saving…' : editId ? 'Update Hat' : 'Create Hat'}
      </button>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(10, 19, 230, 0.25);
          border-color: #0A13E6;
        }
      `}</style>
    </form>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
