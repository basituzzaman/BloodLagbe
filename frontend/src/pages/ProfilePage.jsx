import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const DISTRICTS = [
  'Bagerhat',
  'Bandarban',
  'Barishal',
  'Bhola',
  'Bogura',
  'Brahmanbaria',
  'Chandpur',
  'Chapainawabganj',
  'Chattogram',
  'Chuadanga',
  "Cox's Bazar",
  'Cumilla',
  'Dhaka',
  'Dinajpur',
  'Faridpur',
  'Feni',
  'Gaibandha',
  'Gazipur',
  'Gopalganj',
  'Habiganj',
  'Jamalpur',
  'Jashore',
  'Jhalokati',
  'Jhenaidah',
  'Joypurhat',
  'Khagrachari',
  'Khulna',
  'Kishoreganj',
  'Kurigram',
  'Kushtia',
  'Lakshmipur',
  'Lalmonirhat',
  'Madaripur',
  'Magura',
  'Manikganj',
  'Meherpur',
  'Moulvibazar',
  'Munshiganj',
  'Mymensingh',
  'Naogaon',
  'Narail',
  'Narayanganj',
  'Narsingdi',
  'Natore',
  'Netrokona',
  'Nilphamari',
  'Noakhali',
  'Pabna',
  'Panchagarh',
  'Patuakhali',
  'Pirojpur',
  'Rajbari',
  'Rajshahi',
  'Rangamati',
  'Rangpur',
  'Satkhira',
  'Shariatpur',
  'Sherpur',
  'Sirajganj',
  'Sunamganj',
  'Sylhet',
  'Tangail',
  'Thakurgaon',
]

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

const buildDefaultDiseaseHistory = () =>
  Object.fromEntries(DISEASES.map((d) => [d.key, 'NONE']))

const parseHealthHistory = (raw) => {
  const diseaseHistory = buildDefaultDiseaseHistory()
  let healthNotes = ''

  if (!raw) {
    return { diseaseHistory, healthNotes }
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
        healthNotes = parsed.notes
      }
      return { diseaseHistory, healthNotes }
    }
  } catch {
    // Backward compatible: old plain text health history becomes notes.
  }

  healthNotes = raw
  return { diseaseHistory, healthNotes }
}

const serializeHealthHistory = (diseaseHistory, healthNotes) =>
  JSON.stringify({
    diseases: diseaseHistory,
    notes: healthNotes || '',
  })

function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    bloodType: '',
    district: '',
    email: '',
    phone: '',
    diseaseHistory: buildDefaultDiseaseHistory(),
    healthNotes: '',
    lastDonationDate: '',
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [healthDocument, setHealthDocument] = useState(null)
  const [uploadError, setUploadError] = useState('')

  const hydrateForm = (data) => {
    const { diseaseHistory, healthNotes } = parseHealthHistory(data.healthHistory)
    setForm({
      name: data.name || '',
      age: data.age ?? '',
      gender: data.gender || '',
      bloodType: data.bloodType || '',
      district: data.district || '',
      email: data.email || '',
      phone: data.phone || '',
      diseaseHistory,
      healthNotes,
      lastDonationDate: data.lastDonationDate || '',
    })
  }

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/profile/me')
      setProfile(res.data)
      hydrateForm(res.data)

      // Load donor details to check for health document
      if (res.data.donorProfileExists || res.data.role === 'DONOR') {
        try {
          const donorId = res.data.donorId
          if (donorId) {
            const donorRes = await api.get(`/donors/${donorId}`)
            setHealthDocument(donorRes.data.hasHealthDocument ? 'Uploaded' : null)
          }
        } catch (e) {
          // Donor details not critical for profile loading
        }
      } else {
        setHealthDocument(null)
      }
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Profile API is unavailable on backend or session expired. Restart backend, then login again.')
      } else {
        setError(e.response?.data?.message || 'Failed to load profile.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('bloodlagbe_token')
    const role = localStorage.getItem('bloodlagbe_role') || ''
    if (!token || role === 'ADMIN') {
      navigate('/auth', { replace: true, state: { from: '/profile' } })
      return
    }
    loadProfile()
  }, [navigate])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onDiseaseStatusChange = (diseaseKey, value) => {
    setForm((prev) => ({
      ...prev,
      diseaseHistory: {
        ...prev.diseaseHistory,
        [diseaseKey]: value,
      },
    }))
  }

  const onEdit = () => {
    setEditing(true)
    setError('')
    setSuccess('')
    setUploadError('')
    if (!isDonor) {
      setHealthDocument(null)
    }
    // Clear file input
    const fileInput = document.querySelector('input[type="file"][accept=".pdf"]')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        bloodType: form.bloodType,
        district: form.district,
        email: form.email,
        phone: form.phone,
      }

      if (profile?.donorProfileExists) {
        payload.healthHistory = serializeHealthHistory(form.diseaseHistory, form.healthNotes)
        payload.lastDonationDate = form.lastDonationDate || null
      }

      const res = await api.put('/profile/me', payload)
      setProfile(res.data)
      hydrateForm(res.data)
      
      // If user doesn't have donor profile but is editing, they're applying to be a donor
      if (!profile?.donorProfileExists && editing && canApplyAsDonor) {
        await applyAsDonor()
      } else {
        setEditing(false)
        setSuccess('Profile updated successfully.')
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
          (typeof e.response?.data === 'string' ? e.response.data : 'Failed to update profile.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = async () => {
    if (!profile?.donorProfileExists) return
    setTogglingAvailability(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/donor/availability', { availability: !profile.availability })
      const updated = { ...profile, availability: !profile.availability }
      setProfile(updated)
      setSuccess('Availability updated.')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update availability.')
    } finally {
      setTogglingAvailability(false)
    }
  }

  const applyAsDonor = async () => {
    setError('')
    setSuccess('')
    try {
      const formData = new FormData()
      formData.append('healthHistory', serializeHealthHistory(form.diseaseHistory, form.healthNotes))
      if (form.lastDonationDate) {
        formData.append('lastDonationDate', form.lastDonationDate)
      }

      const symptoms = Object.entries(form.diseaseHistory)
        .filter(([_, status]) => status === 'HAVE')
        .map(([diseaseKey]) => {
          const disease = DISEASES.find(d => d.key === diseaseKey)
          return disease ? disease.label : null
        })
        .filter(Boolean)
        .join(',')
      if (symptoms) {
        formData.append('symptoms', symptoms)
      }

      // Get the file input element
      const fileInput = document.querySelector('input[type="file"][accept=".pdf"]')
      if (!fileInput || fileInput.files.length === 0) {
        setError('Health document (PDF) is required for donor application.')
        return
      }
      formData.append('file', fileInput.files[0])

      await api.post('/donor/apply', formData)
      setSuccess('Donor application submitted successfully. Please wait for admin approval.')
      setHealthDocument(null)
      setUploadError('')
      // Clear file input
      if (fileInput) {
        fileInput.value = ''
      }
      await loadProfile() // Reload to show donor profile exists
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit donor application.')
    }
  }

  const onDocumentUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit')
      return
    }

    setUploadError('')
    // For existing donors, upload immediately
    if (isDonor) {
      uploadDocument(file)
    } else {
      // For donor application, just show filename
      setHealthDocument(file.name)
    }
  }

  const uploadDocument = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/donor/health-document', formData)
      setSuccess('Health document uploaded successfully')
      setHealthDocument('Uploaded')
      await loadProfile() // Reload to update status
    } catch (e) {
      setUploadError(e.response?.data || 'Failed to upload health document')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-xs text-slate-500">
        Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-xs text-red-700">
        {error || 'Unable to load profile.'}
      </div>
    )
  }

  const isDonor = profile.role === 'DONOR' || profile.donorProfileExists
  const canApplyAsDonor = profile.role === 'USER' && !profile.donorProfileExists

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-xs bg-cream-100 min-h-screen">
      <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-primary-700">Profile</h1>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                hydrateForm(profile)
                setEditing(true)
                setSuccess('')
                setError('')
              }}
              className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-700 hover:border-primary-600 hover:text-primary-600"
            >
              Edit Profile
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Account type: {profile.role === 'DONOR' ? 'Donor' : profile.role === 'RECEIVER' ? 'Blood Receiver' : 'User'}
        </p>
      </section>

      {isDonor && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-primary-700">Donor availability</h2>
              <p className="text-xs text-slate-500">
                Your previously saved donor profile data is shown below.
              </p>
            </div>
            <button
              type="button"
              disabled={togglingAvailability}
              onClick={toggleAvailability}
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-medium shadow-sm border ${
                profile.availability
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                  : 'bg-white text-gray-700 hover:bg-cream-100 border-gray-300'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {profile.availability ? 'Available' : 'Unavailable'}
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Donation count: {profile.donationCount ?? 0}
          </p>
        </section>
      )}

      {canApplyAsDonor && (
        <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-primary-700">Become a Donor</h2>
            <p className="text-xs text-gray-600">
              Apply to become a blood donor and help save lives. You'll need to provide your health history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-500"
          >
            Apply as Donor
          </button>
        </section>
      )}

      {profile.role === 'RECEIVER' && (
        <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-primary-700">Blood Receiver Account</h2>
            <p className="text-xs text-gray-600">
              As a blood receiver, you can search for donors and request blood when needed. 
              If you wish to become a donor, you would need to register as a user instead.
            </p>
          </div>
        </section>
      )}

      <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-5">
        <form onSubmit={onSave} className="grid gap-3 text-xs md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Full name</label>
            <input
              name="name"
              required
              disabled={!editing}
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Age</label>
            <input
              name="age"
              type="number"
              min="18"
              required
              disabled={!editing}
              value={form.age}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              required
              disabled={!editing}
              value={form.gender}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Blood type</label>
            <select
              name="bloodType"
              required
              disabled={!editing}
              value={form.bloodType}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">District</label>
            <select
              name="district"
              required
              disabled={!editing}
              value={form.district}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            >
              <option value="">Select</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Phone number</label>
            <input
              name="phone"
              required
              disabled={!editing}
              value={form.phone}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              disabled={!editing}
              value={form.email}
              onChange={onChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
            />
          </div>

          {(isDonor || (canApplyAsDonor && editing)) && (
            <>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">
                  Health history (for each disease) {!isDonor && '(Required for donor application)'}
                </label>
                <div className="space-y-2 rounded-lg border border-primary-200 p-3">
                  {DISEASES.map((disease) => (
                    <div
                      key={disease.key}
                      className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px] md:items-center"
                    >
                      <span className="text-gray-700">{disease.label}</span>
                      {editing ? (
                        <select
                          value={form.diseaseHistory[disease.key]}
                          onChange={(e) => onDiseaseStatusChange(disease.key, e.target.value)}
                          className="rounded-lg border border-primary-200 px-3 py-2 bg-white"
                        >
                          <option value="NONE">Never</option>
                          <option value="HAD">Had before</option>
                          <option value="HAVE">Have now</option>
                        </select>
                      ) : (
                        <span className="rounded-lg bg-cream-100 px-3 py-2 text-gray-700">
                          {STATUS_LABELS[form.diseaseHistory[disease.key]]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {(isDonor || (canApplyAsDonor && editing)) && (
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">
                    Health Document (PDF) {!isDonor ? '* Required for donor application' : '(Update your health document)'}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={onDocumentUpload}
                      disabled={!editing}
                      className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100 text-xs"
                    />
                    {uploadError && (
                      <p className="text-xs text-red-600">{uploadError}</p>
                    )}
                    {healthDocument && (
                      <p className="text-xs text-emerald-600">
                        Document uploaded: {healthDocument}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Max file size: 5MB. Only PDF files allowed. This document is visible only to admins.
                    </p>
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Additional notes (optional)</label>
                <textarea
                  name="healthNotes"
                  disabled={!editing}
                  value={form.healthNotes}
                  onChange={onChange}
                  rows={3}
                  className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Last donation date</label>
                <input
                  name="lastDonationDate"
                  type="date"
                  disabled={!editing}
                  value={form.lastDonationDate || ''}
                  onChange={onChange}
                  className="rounded-lg border border-primary-200 px-3 py-2 bg-white disabled:bg-cream-100"
                />
              </div>
            </>
          )}

          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="md:col-span-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
              {success}
            </div>
          )}

          {editing && (
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-500 disabled:bg-gray-300"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  hydrateForm(profile)
                  setEditing(false)
                  setError('')
                  setSuccess('')
                }}
                className="rounded-lg border border-primary-200 px-4 py-2 text-gray-700 hover:border-primary-600 hover:text-primary-600"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

export default ProfilePage
