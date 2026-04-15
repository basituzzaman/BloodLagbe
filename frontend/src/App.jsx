import { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import DonorListPage from './pages/DonorListPage'
import DonorDetailsPage from './pages/DonorDetailsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthChoicePage from './pages/AuthChoicePage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [logoFailed, setLogoFailed] = useState(false)
  const token = localStorage.getItem('bloodlagbe_token')
  const role = localStorage.getItem('bloodlagbe_role')
  const isLoggedIn = Boolean(token) && role !== 'ADMIN'
  const isAdmin = role === 'ADMIN'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isHomeRoute = location.pathname === '/'

  const logout = () => {
    localStorage.removeItem('bloodlagbe_token')
    localStorage.removeItem('bloodlagbe_user_id')
    localStorage.removeItem('bloodlagbe_role')
    navigate('/', { replace: true })
  }

  return (
    <div className="theme-rb min-h-screen flex flex-col bg-slate-950">
      {!isAdminRoute && (
        <header className="fixed top-0 inset-x-0 z-40 bg-gradient-to-b from-black/70 via-black/45 to-transparent">
          <div className="w-full h-20 flex items-center justify-between px-4 md:px-8">
            <Link to="/" className="flex items-center gap-2">
              {!logoFailed ? (
                <img
                  src="/logo.png"
                  alt="BloodLagbe logo"
                  onError={() => setLogoFailed(true)}
                  className="h-[64px] md:h-[74px] w-auto object-contain"
                />
              ) : (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                    BL
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">BloodLagbe</span>
                    <span className="text-xs text-slate-200">
                      Connecting Donors &amp; Recipients
                    </span>
                  </div>
                </>
              )}
            </Link>
            <nav className="flex items-center gap-3 md:gap-4 text-sm">
              <Link
                to="/notifications"
                className="rounded-full px-3 py-1.5 text-white transition hover:bg-white/15 hover:text-white"
              >
                Notifications
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/auth"
                  className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:from-rose-500 hover:to-rose-500"
                >
                  Register / Login
                </Link>
              )}
              {isLoggedIn && !isAdmin && (
                <Link
                  to="/profile"
                  className="rounded-full border border-cyan-300/70 px-4 py-1.5 text-sm font-medium text-rose-200 hover:border-cyan-200 hover:text-white"
                >
                  Profile
                </Link>
              )}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:from-rose-500 hover:to-rose-500"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={`flex-1 bg-cream-100 ${!isAdminRoute && !isHomeRoute ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/donors" element={<DonorListPage />} />
          <Route path="/donors/:id" element={<DonorDetailsPage />} />
          <Route path="/auth" element={<AuthChoicePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin dashboard is mounted under /admin */}
          <Route path="/admin/*" element={<AdminDashboardPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && (
        <section className="bg-primary-900 text-cream-50 border-t border-primary-800">
          <div className="w-full px-4 py-10 md:px-8">
            <div className="max-w-md space-y-4">
              <h3 className="text-2xl font-semibold text-white">Contact Us</h3>
              <div className="space-y-3 text-lg">
                <p className="flex items-start gap-3">
                  <span className="text-primary-400 mt-0.5">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <span>House 5, Road no 3, Mohammadi Homes Limited</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-primary-400 mt-0.5">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.7-3.1 19.5 19.5 0 0 1-6-6 19.9 19.9 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9Z" />
                    </svg>
                  </span>
                  <span>+8801772031176</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-primary-400 mt-0.5">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <span>info@bloodlagbe.com</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {!isAdminRoute && (
        <footer className="border-t border-primary-200 bg-cream-50">
          <div className="w-full px-4 py-4 md:px-8 text-xs text-gray-600 flex items-center justify-between">
            <span>(c) {new Date().getFullYear()} BloodLagbe. All rights reserved.</span>
            <span>Serving all 64 districts of Bangladesh.</span>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App

