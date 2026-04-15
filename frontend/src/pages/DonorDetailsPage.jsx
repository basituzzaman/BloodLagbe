import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'

const DISEASES = [
  { key: 'hiv', label: 'HIV' },
  { key: 'hepatitis', label: 'Hepatitis' },
  { key: 'lowHemoglobin', label: 'Low Hemoglobin' },
  { key: 'recentSurgery', label: 'Recent Surgery' },
  { key: 'seriousDisease', label: 'Serious Disease' },
]

const STATUS_LABELS = {
  NONE: 'Never',
  HAD: 'Had before',
  HAVE: 'Have now',
}

const STATUS_STYLES = {
  NONE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  HAD: 'bg-amber-50 text-amber-700 border-amber-100',
  HAVE: 'bg-rose-50 text-rose-700 border-rose-100',
}

const buildDefaultDiseaseHistory = () =>
  Object.fromEntries(DISEASES.map((disease) => [disease.key, 'NONE']))

const parseHealthHistory = (raw) => {
  const diseaseHistory = buildDefaultDiseaseHistory()
  let notes = ''

  if (!raw) {
    return { diseaseHistory, notes }
  }

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      if (parsed.diseases && typeof parsed.diseases === 'object') {
        for (const disease of DISEASES) {
          const value = parsed.diseases[disease.key]
          if (value === 'NONE' || value === 'HAD' || value === 'HAVE') {
            diseaseHistory[disease.key] = value
          }
        }
      }
      if (typeof parsed.notes === 'string') {
        notes = parsed.notes
      }
      return { diseaseHistory, notes }
    }
  } catch {
    notes = raw
  }

  return { diseaseHistory, notes }
}

function DonorDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestFor, setRequestFor] = useState('MYSELF')
  const [requestSent, setRequestSent] = useState(false)

  // Check authentication
  const currentUserId = Number(localStorage.getItem('bloodlagbe_user_id'))
  const currentToken = localStorage.getItem('bloodlagbe_token')

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentToken || !currentUserId) {
      navigate('/login', { replace: true })
      return
    }
    setLoading(true)
    api
      .get(`/donors/${id}`)
      .then((res) => setDonor(res.data))
      .catch(() => setError('Unable to load donor details.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleRequest = async () => {
    setRequesting(true)
    setError('')
    try {
      await api.post('/request-blood', {
        donorId: donor.id,
        requestFor,
      })
      setRequestSent(true)
    } catch (e) {
      if (e.response && e.response.status === 401) {
        navigate('/auth')
        return
      }
      setError(
        e.response?.data?.message || 'Failed to send request. Please try again.',
      )
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-600 bg-cream-100 min-h-screen">
        Loading donor information...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!donor) return null

  const isLoggedIn =
    Boolean(localStorage.getItem('bloodlagbe_token')) &&
    localStorage.getItem('bloodlagbe_role') !== 'ADMIN'
  const isSelfDonor = Number.isFinite(currentUserId) && donor.userId === currentUserId
  const isDonorUnavailable = !donor.availability
  const { diseaseHistory, notes } = parseHealthHistory(donor.healthHistory)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary-600 text-lg text-primary-600 hover:border-primary-500 hover:text-primary-500"
        aria-label="Go back"
      >
        &larr;
      </button>

      <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-primary-700">{donor.name}</h1>
            <p className="text-xs text-gray-600">
              {donor.gender} | {donor.age} years | {donor.district}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              Blood Type: {donor.bloodType}
            </span>
            <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              Rank: {donor.rank}
            </span>
          </div>
        </div>
        <div className="grid gap-3 text-xs text-gray-600 md:grid-cols-2">
          <div className="space-y-1">
            <p>
              <span className="font-medium text-gray-800">Availability:</span>{' '}
              <span
                className={
                  donor.availability
                    ? 'text-emerald-600 font-medium'
                    : 'text-gray-500 font-medium'
                }
              >
                {donor.availability ? 'Available' : 'Unavailable'}
              </span>
            </p>
            <p>
              <span className="font-medium text-gray-800">Total donations:</span>{' '}
              {donor.donationCount}
            </p>
          </div>
          {isLoggedIn && (
            <div className="space-y-1">
              <p>
                <span className="font-medium text-gray-800">Phone:</span>{' '}
                {donor.phone || 'Visible after admin approval'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Last donation:</span>{' '}
                {donor.lastDonationDate || 'Not provided'}
              </p>
            </div>
          )}
        </div>
        {isLoggedIn && donor.healthHistory && (
          <div className="pt-3 border-t border-dashed border-primary-200 space-y-3">
            <p className="text-xs font-semibold text-primary-700">Health history</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {DISEASES.map((disease) => {
                const status = diseaseHistory[disease.key] || 'NONE'
                const style = STATUS_STYLES[status] || STATUS_STYLES.NONE
                return (
                  <div
                    key={disease.key}
                    className="rounded-lg border border-primary-200 bg-cream-50 px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-gray-700">{disease.label}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${style}`}
                    >
                      {STATUS_LABELS[status] || STATUS_LABELS.NONE}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg border border-primary-200 bg-cream-50 px-3 py-2">
              <p className="text-[11px] font-medium text-gray-700">Additional notes</p>
              <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                {notes && notes.trim() ? notes : 'Not provided'}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-primary-700">Request blood from this donor</h2>
            <p className="text-xs text-gray-600">
              Select whether this request is for yourself or for another person.
            </p>
          </div>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="rounded-full border border-primary-200 px-3 py-1 text-[11px] font-medium text-gray-700 hover:border-primary-600 hover:text-primary-600"
            >
              Login to Request
            </button>
          )}
        </div>

        {isSelfDonor ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            You cannot send a blood request to your own donor profile.
          </div>
        ) : isDonorUnavailable ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            This donor is currently unavailable and cannot receive blood requests right now.
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="requestFor"
                  value="MYSELF"
                  checked={requestFor === 'MYSELF'}
                  onChange={(e) => setRequestFor(e.target.value)}
                  className="h-3 w-3 text-primary-600"
                />
                <span>Myself</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="requestFor"
                  value="ANOTHER"
                  checked={requestFor === 'ANOTHER'}
                  onChange={(e) => setRequestFor(e.target.value)}
                  className="h-3 w-3 text-primary-600"
                />
                <span>Another person</span>
              </label>
            </div>
            <button
              type="button"
              disabled={!isLoggedIn || requesting || isDonorUnavailable}
              onClick={handleRequest}
              className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {requesting ? 'Sending request...' : 'Request Blood'}
            </button>
          </div>
        )}

        {requestSent && (
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <p className="font-medium">Request sent successfully.</p>
            <p>
              The donor has been notified. You can contact them directly at{' '}
              <span className="font-semibold">{donor.phone || 'their registered number'}</span>.
            </p>
          </div>
        )}
        {error && (
          <div className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </section>
    </div>
  )
}

export default DonorDetailsPage


