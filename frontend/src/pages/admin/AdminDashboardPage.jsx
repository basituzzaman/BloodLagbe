import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

function AdminGuard({ children }) {
  const location = useLocation()
  const role = localStorage.getItem('bloodlagbe_admin_role')
  const token = localStorage.getItem('bloodlagbe_admin_token')
  if (role !== 'ADMIN' || !token) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  }
  return children
}

function AdminLoginPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, userId, role } = res.data

      if (role !== 'ADMIN') {
        setError('Only admin accounts can login here.')
        return
      }

      localStorage.setItem('bloodlagbe_admin_token', token)
      localStorage.setItem('bloodlagbe_admin_user_id', String(userId))
      localStorage.setItem('bloodlagbe_admin_role', role)

      const from = location.state?.from || '/admin/users'
      navigate(from, { replace: true })
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream-100">
      <div className="w-full max-w-md rounded-2xl bg-cream-50 p-6 shadow-sm border border-primary-200">
        <h1 className="text-lg font-semibold text-primary-700">Admin Login</h1>
        <p className="mt-1 text-xs text-gray-600">
          This login is only for admin accounts.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-primary-200 px-3 py-2 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}

function UsersPanel() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
      setError('')
    } catch (e) {
      setUsers([])
      setError(e.response?.data?.message || 'Failed to load users.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (userId) => {
    try {
      await api.put('/admin/approve-user', null, { params: { userId } })
      await load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve user.')
    }
  }

  const reject = async (userId) => {
    try {
      await api.put('/admin/reject-user', null, { params: { userId } })
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Reject API is unavailable on backend. Restart backend server and try again.')
        return
      }
      setError(e.response?.data?.message || e.response?.data || 'Failed to reject user.')
    }
  }

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`)
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Delete API is unavailable on backend. Restart backend server and try again.')
        return
      }
      setError(e.response?.data?.message || e.response?.data || 'Failed to delete user.')
    }
  }

  return (
    <div className="space-y-2 text-xs">
      <h2 className="text-sm font-semibold text-primary-700">Users</h2>
      <div className="overflow-x-auto border border-primary-200 rounded-xl">
        <table className="min-w-full text-xs">
          <thead className="bg-cream-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="px-3 py-2 text-left font-medium">Approved</th>
              <th className="px-3 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 text-gray-800">{u.name}</td>
                <td className="px-3 py-2 text-gray-600">{u.email}</td>
                <td className="px-3 py-2 text-gray-600">
                  {u.role === 'DONOR'
                    ? 'Donor'
                    : u.donorProfileExists
                      ? 'Donor Applicant'
                      : u.role === 'RECEIVER'
                        ? 'Receiver'
                        : u.role === 'USER'
                          ? 'User'
                          : u.role}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      u.approved
                        ? 'bg-emerald-50 text-emerald-700'
                        : u.rejected
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {u.approved ? 'Approved' : u.rejected ? 'Rejected' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {u.role !== 'ADMIN' && (
                    <div className="inline-flex items-center gap-2">
                      {!u.approved && !u.rejected && (
                        <>
                          <button
                            type="button"
                            onClick={() => approve(u.id)}
                            className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-700 hover:border-primary-600 hover:text-primary-600"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(u.id)}
                            className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-700 hover:border-red-400"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteUser(u.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-700 hover:border-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

function DonorsPanel() {
  const [donors, setDonors] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/admin/donors')
      setDonors(res.data)
      setError('')
    } catch (e) {
      setDonors([])
      setError(e.response?.data?.message || 'Failed to load donors.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approveDonor = async (userId) => {
    try {
      await api.put('/admin/approve-donor', null, { params: { userId } })
      setSuccess('Donor approved successfully.')
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Approve donor API is unavailable on backend. Restart backend server and try again.')
        return
      }
      setError(e.response?.data?.message || 'Failed to approve donor.')
    }
  }

  const rejectDonor = async (userId) => {
    try {
      await api.put('/admin/reject-donor', null, { params: { userId } })
      setSuccess('Donor rejected successfully.')
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Reject API is unavailable on backend. Restart backend server and try again.')
        return
      }
      setError(e.response?.data?.message || e.response?.data || 'Failed to reject donor.')
    }
  }

  const deleteDonor = async (userId) => {
    try {
      await api.delete(`/admin/donors/${userId}`)
      setSuccess('Donor deleted successfully.')
      await load()
    } catch (e) {
      if (e.response?.status === 401) {
        setError('Delete donor API is unavailable on backend. Restart backend server and try again.')
        return
      }
      setError(e.response?.data?.message || e.response?.data || 'Failed to delete donor.')
    }
  }

  return (
    <div className="space-y-2 text-xs">
      <h2 className="text-sm font-semibold text-primary-700">Donors</h2>
      <div className="overflow-x-auto border border-primary-200 rounded-xl">
        <table className="min-w-full text-xs">
          <thead className="bg-cream-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Blood Type</th>
              <th className="px-3 py-2 text-left font-medium">District</th>
              <th className="px-3 py-2 text-left font-medium">User Approved</th>
              <th className="px-3 py-2 text-left font-medium">Donor Approved</th>
              <th className="px-3 py-2 text-left font-medium">Availability</th>
              <th className="px-3 py-2 text-left font-medium">Health Doc</th>
              <th className="px-3 py-2 text-left font-medium">Donations</th>
              <th className="px-3 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {donors.map((d) => (
              <tr key={d.donorId}>
                <td className="px-3 py-2 text-gray-800">{d.name}</td>
                <td className="px-3 py-2 text-gray-600">{d.bloodType}</td>
                <td className="px-3 py-2 text-gray-600">{d.district}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      d.userApproved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {d.userApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      d.donorApproved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {d.donorApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      d.availability
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {d.availability ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {d.hasHealthDocument ? (
                    <span className="text-emerald-600">✓ Uploaded</span>
                  ) : (
                    <span className="text-gray-400">Not uploaded</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">{d.donationCount}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    {d.userApproved && !d.donorApproved && (
                      <button
                        type="button"
                        onClick={() => approveDonor(d.userId)}
                        className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-700 hover:border-primary-600 hover:text-primary-600"
                      >
                        Approve donor
                      </button>
                    )}
                    {!d.userApproved && (
                      <span className="text-[11px] text-amber-700">Approve user first</span>
                    )}
                    {!d.donorApproved && (
                      <button
                        type="button"
                        onClick={() => rejectDonor(d.userId)}
                        className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-700 hover:border-red-400"
                      >
                        Reject donor
                      </button>
                    )}
                    {d.donorApproved && (
                      <button
                        type="button"
                        onClick={() => deleteDonor(d.userId)}
                        className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-700 hover:border-red-400"
                      >
                        Delete donor
                      </button>
                    )}
                    {d.hasHealthDocument && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await api.get(`/admin/donor/${d.userId}/health-document`, {
                              responseType: 'blob'
                            })
                            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
                            window.open(url, '_blank')
                          } catch (e) {
                            alert('Error downloading health document')
                          }
                        }}
                        className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-primary-700 hover:border-primary-600 hover:text-primary-600"
                      >
                        View Health Doc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {success}
        </div>
      )}
    </div>
  )
}

function RequestsPanel() {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/requests')
        setRequests(res.data)
        setError('')
      } catch (e) {
        setRequests([])
        setError(e.response?.data?.message || 'Failed to load blood requests.')
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-2 text-xs">
      <h2 className="text-sm font-semibold text-primary-700">Blood requests (read-only)</h2>
      <p className="text-[11px] text-slate-500">
        Requests are created by recipients and only donors can accept or reject them.
      </p>
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto border border-primary-200 rounded-xl">
        <table className="min-w-full text-xs">
          <thead className="bg-cream-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Requester</th>
              <th className="px-3 py-2 text-left font-medium">Donor</th>
              <th className="px-3 py-2 text-left font-medium">For</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Created at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-gray-800">{r.requesterName}</td>
                <td className="px-3 py-2 text-gray-600">{r.donorName}</td>
                <td className="px-3 py-2 text-gray-600">{r.requestFor}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      r.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : r.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatsPanel() {
  const [stats, setStats] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/statistics')
        setStats(res.data)
        setError('')
      } catch (e) {
        setStats([])
        setError(e.response?.data?.message || 'Failed to load statistics.')
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-2 text-xs">
      <h2 className="text-sm font-semibold text-primary-700">Statistics</h2>
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.bloodType}
            className="rounded-xl border border-primary-200 bg-cream-50 px-3 py-2"
          >
            <p className="text-[11px] text-gray-600">Available {s.bloodType}</p>
            <p className="text-base font-semibold text-primary-700">{s.availableDonors}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminDashboardInner() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    donorApplicants: 0,
    pendingDonorApprovals: 0,
  })

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [usersRes, donorsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/donors'),
        ])
        const users = usersRes.data || []
        const donors = donorsRes.data || []
        setSummary({
          totalUsers: users.length,
          pendingUsers: users.filter((u) => !u.approved).length,
          donorApplicants: users.filter((u) => u.donorProfileExists && u.role !== 'DONOR').length,
          pendingDonorApprovals: donors.filter((d) => d.userApproved && !d.donorApproved).length,
        })
      } catch {
        setSummary({
          totalUsers: 0,
          pendingUsers: 0,
          donorApplicants: 0,
          pendingDonorApprovals: 0,
        })
      }
    }

    loadSummary()
  }, [])

  const logout = () => {
    localStorage.removeItem('bloodlagbe_admin_token')
    localStorage.removeItem('bloodlagbe_admin_user_id')
    localStorage.removeItem('bloodlagbe_admin_role')
    navigate('/admin', { replace: true })
  }

  return (
    <div className="w-full px-4 md:px-8 py-7 md:py-8 bg-cream-100 min-h-screen">
      <div className="mx-auto w-full max-w-[120rem] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage user approvals, donor approvals, requests, and platform availability.
            </p>
          </div>
          <nav className="flex items-center gap-2 text-xs">
            <Link
              to="/admin/users"
              className="rounded-full border border-primary-300 px-3 py-1 text-slate-800 hover:border-primary-500 hover:text-primary-600 font-medium bg-cream-50"
            >
              Users
            </Link>
            <Link
              to="/admin/donors"
              className="rounded-full border border-primary-300 px-3 py-1 text-slate-800 hover:border-primary-500 hover:text-primary-600 font-medium bg-cream-50"
            >
              Donors
            </Link>
            <Link
              to="/admin/requests"
              className="rounded-full border border-primary-300 px-3 py-1 text-slate-800 hover:border-primary-500 hover:text-primary-600 font-medium bg-cream-50"
            >
              Blood Requests
            </Link>
            <Link
              to="/admin/statistics"
              className="rounded-full border border-primary-300 px-3 py-1 text-slate-800 hover:border-primary-500 hover:text-primary-600 font-medium bg-cream-50"
            >
              Statistics
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-red-600 px-3 py-1 text-[11px] text-red-600 hover:bg-red-50 font-semibold"
            >
              Logout
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3">
            <p className="text-[11px] text-slate-600 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">{summary.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3">
            <p className="text-[11px] text-slate-600 font-medium">Pending User Approvals</p>
            <p className="text-2xl font-semibold text-amber-600 mt-1">{summary.pendingUsers}</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3">
            <p className="text-[11px] text-slate-600 font-medium">Donor Applicants</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">{summary.donorApplicants}</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3">
            <p className="text-[11px] text-slate-600 font-medium">Pending Donor Approvals</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{summary.pendingDonorApprovals}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-200 bg-cream-50 p-4 md:p-5">
          <Routes>
            <Route path="/" element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersPanel />} />
            <Route path="donors" element={<DonorsPanel />} />
            <Route path="requests" element={<RequestsPanel />} />
            <Route path="statistics" element={<StatsPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AdminDashboardPage() {
  const role = localStorage.getItem('bloodlagbe_admin_role')
  const token = localStorage.getItem('bloodlagbe_admin_token')

  if (role !== 'ADMIN' || !token) {
    return <AdminLoginPanel />
  }

  return (
    <AdminGuard>
      <AdminDashboardInner />
    </AdminGuard>
  )
}

export default AdminDashboardPage
