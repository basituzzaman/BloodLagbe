import { Link } from 'react-router-dom'

function AuthChoicePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-cream-50 p-6 shadow-sm border border-primary-200">
        <h1 className="text-lg font-semibold text-primary-700">Register / Login</h1>
        <p className="mt-1 text-xs text-gray-600">
          Select your account type first.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-primary-200 p-4 space-y-3 bg-white">
            <h2 className="text-sm font-semibold text-primary-700">Donor</h2>
            <p className="text-xs text-gray-600">
              Register as a user and apply to become a donor later, or login if you already have an account.
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/login?type=donor"
                className="rounded-full border border-primary-200 px-4 py-1.5 text-xs text-primary-600 hover:border-primary-600 hover:text-primary-700"
              >
                Login
              </Link>
              <Link
                to="/register?type=donor"
                className="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-500 shadow-sm"
              >
                Register
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-primary-200 p-4 space-y-3 bg-white">
            <h2 className="text-sm font-semibold text-primary-700">Receiver</h2>
            <p className="text-xs text-gray-600">
              Register or login as someone requesting blood.
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/login?type=receiver"
                className="rounded-full border border-primary-200 px-4 py-1.5 text-xs text-primary-600 hover:border-primary-600 hover:text-primary-700"
              >
                Login
              </Link>
              <Link
                to="/register?type=receiver"
                className="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-500 shadow-sm"
              >
                Register
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AuthChoicePage
