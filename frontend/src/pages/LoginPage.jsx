import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const accountType = searchParams.get('type') === 'donor' ? 'donor' : 'receiver'

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, userId, role } = res.data

      if (role === 'ADMIN') {
        setError('Admin login is only available at /admin')
        return
      }
      // Allow USER (potential donor) and DONOR to login through donor login page
      if (accountType === 'donor' && role !== 'DONOR' && role !== 'USER') {
        setError('This account is not a donor account. Choose Receiver login.')
        return
      }
      // Only RECEIVER should use receiver login
      if (accountType === 'receiver' && role !== 'RECEIVER') {
        setError('This account is not a receiver account. Choose appropriate login.')
        return
      }

      localStorage.setItem('bloodlagbe_token', token)
      localStorage.setItem('bloodlagbe_user_id', String(userId))
      localStorage.setItem('bloodlagbe_role', role)

      const from = location.state?.from || '/'
      navigate(from, { replace: true })
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-6 shadow-sm border border-primary-200">
        <h1 className="text-lg font-semibold text-primary-700">
          Login as {accountType === 'donor' ? 'Donor' : 'Receiver'}
        </h1>
        <p className="mt-1 text-xs text-gray-600">
          Use your registered email and password to continue.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-500 disabled:bg-gray-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-600">
          New here?{' '}
          <Link to={`/register?type=${accountType}`} className="text-primary-600 hover:text-primary-700">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-xs text-gray-600">
          Need different account type?{' '}
          <Link to="/auth" className="text-primary-600 hover:text-primary-700">
            Choose here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
