import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const districts = [
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

function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    bloodType: '',
    district: '',
    phone: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlType = searchParams.get('type')
  const accountType = urlType === 'receiver' ? 'receiver' : urlType === 'donor' ? 'donor' : 'user'
  console.log('DEBUG: URL type param:', urlType)
  console.log('DEBUG: Calculated accountType:', accountType)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        accountType: accountType.toUpperCase(),
      }
      console.log('DEBUG: Sending payload:', payload)
      await api.post('/auth/register', payload)
      console.log('DEBUG: Registration successful')
      setSuccess(true)
      setTimeout(() => navigate(`/login?type=${accountType}`), 1500)
    } catch (e) {
      const backendMessage =
        typeof e.response?.data === 'string'
          ? e.response.data
          : e.response?.data?.message
      setError(backendMessage || 'Registration failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-cream-50 p-6 shadow-sm border border-primary-200">
        <h1 className="text-lg font-semibold text-primary-700">
          Register as {accountType === 'receiver' ? 'Blood Receiver' : 'User'}
        </h1>
        <p className="mt-1 text-xs text-gray-600">
          After registration, an admin will approve your account before you can log in.
          {accountType === 'user' && ' You can apply to become a donor later from your profile.'}
          {accountType === 'receiver' && ' You will be able to search for donors and request blood.'}
        </p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 text-xs md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Full name</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Age</label>
            <input
              name="age"
              type="number"
              min="18"
              required
              value={form.age}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              required
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={form.bloodType}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={form.district}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select</option>
              {districts.map((d) => (
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
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="md:col-span-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Registration successful. Please wait for admin approval before logging in.
            </div>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-500 disabled:bg-gray-300"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-gray-600">
          Already have an account?{' '}
          <Link to={`/login?type=${accountType}`} className="text-primary-600 hover:text-primary-700">
            Login
          </Link>
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Want to register as different type?{' '}
          <Link to="/auth" className="text-primary-600 hover:text-primary-700">
            Choose here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
