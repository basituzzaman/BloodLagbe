import { useEffect, useState } from 'react'
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

const heroSlides = [
  {
    title: 'BloodLagbe - Connecting Donors & Recipients',
    subtitle: 'Across all 64 districts of Bangladesh. Fast. Reliable. Life-saving.',
    highlight: 'Find a matching donor within minutes.',
    image:
      'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=2000&q=80',
  },
  {
    title: 'Every Drop Counts',
    subtitle: 'Verified donors, transparent availability, and real-time requests.',
    highlight: 'Built for emergency response and planned donations.',
    image:
      'https://images.unsplash.com/photo-1615461066159-fea0960485d5?auto=format&fit=crop&w=2000&q=80',
  },
  {
    title: 'Donate Blood, Save Lives',
    subtitle: 'Track your donations, earn badges, and inspire your community.',
    highlight: 'Bronze, Silver, Gold, and Platinum donor ranks.',
    image:
      'https://images.unsplash.com/photo-1683791895200-201c0c40310f?auto=format&fit=crop&w=2000&q=80',
  },
]

function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0)
  const [stats, setStats] = useState([])
  const [donors, setDonors] = useState([])
  const [bloodType, setBloodType] = useState('')
  const [district, setDistrict] = useState('')
  const [, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentUserId = Number(localStorage.getItem('bloodlagbe_user_id'))

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api
      .get('/donors/stats/availability')
      .then((res) => {
        const byType = Object.fromEntries(res.data.map((row) => [row.bloodType, row.availableDonors]))
        const prepared = BLOOD_GROUPS.map((g) => ({
          bloodType: g,
          availableDonors: byType[g] ?? 0,
        }))
        setStats(prepared)
      })
      .catch(() => {
        setStats(BLOOD_GROUPS.map((g) => ({ bloodType: g, availableDonors: 0 })))
      })
  }, [])

  const loadDonors = () => {
    const params = {}
    if (bloodType) params.bloodType = bloodType
    if (district) params.district = district
    api
      .get('/donors', { params })
      .then((res) => {
        const filteredDonors = res.data.filter(
          (d) => !Number.isFinite(currentUserId) || d.userId !== currentUserId,
        )
        setDonors(filteredDonors)
      })
      .catch(() => setDonors([]))
  }

  useEffect(() => {
    loadDonors()
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (bloodType) params.bloodType = bloodType
    if (district) params.district = district
    setSearchParams(params)
    loadDonors()
  }

  const currentSlide = heroSlides[slideIndex]

  const getAvailabilityStatus = (count) => {
    if (count <= 2) {
      return {
        label: 'Critical',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
        accentClass: 'text-primary-600',
        meterClass: 'bg-primary-600',
      }
    }
    if (count <= 5) {
      return {
        label: 'Low',
        badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200',
        accentClass: 'text-orange-600',
        meterClass: 'bg-orange-500',
      }
    }
    return {
      label: 'Available',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      accentClass: 'text-emerald-600',
      meterClass: 'bg-emerald-500',
    }
  }

  return (
    <div className="w-full bg-cream-100 min-h-screen">
      <section className="relative h-[85vh] min-h-[560px] md:min-h-[640px] overflow-hidden bg-primary-900">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === slideIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/70 to-primary-700/50" />
          </div>
        ))}

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-8 pt-24 md:px-10 md:pb-10 md:pt-28 text-white">
          <div className="space-y-5 max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-cream-100/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm text-cream-100">
              Across Bangladesh
            </span>
            <h1 className="text-4xl md:text-7xl font-bold leading-tight">{currentSlide.title}</h1>
            <p className="text-base md:text-3xl text-slate-100 max-w-3xl">{currentSlide.subtitle}</p>
            <p className="text-sm md:text-lg text-primary-200">{currentSlide.highlight}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center rounded-full border border-cream-200/70 bg-cream-100/10 px-5 py-2.5 text-sm font-semibold text-cream-100 backdrop-blur-sm hover:bg-cream-100/20"
              >
                Register / Login
              </Link>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('donor-search')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center rounded-full bg-cream-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-cream-100"
              >
                Find Blood
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === slideIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSlideIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute bottom-8 left-5 z-30 inline-flex h-12 w-12 items-center justify-center bg-transparent text-4xl font-bold leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] hover:text-cream-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-300"
          style={{ backgroundColor: 'transparent' }}
          aria-label="Previous slide"
        >
          &#10094;
        </button>
        <button
          type="button"
          onClick={() => setSlideIndex((i) => (i + 1) % heroSlides.length)}
          className="absolute bottom-8 right-5 z-30 inline-flex h-12 w-12 items-center justify-center bg-transparent text-4xl font-bold leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] hover:text-cream-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cream-300"
          style={{ backgroundColor: 'transparent' }}
          aria-label="Next slide"
        >
          &#10095;
        </button>
      </section>

      <div className="px-4 md:px-8 py-10 space-y-12">
        <section className="relative overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-cream-100 to-primary-50 p-6 md:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_0%,rgba(230,57,70,0.2),transparent_42%),radial-gradient(circle_at_85%_100%,rgba(204,0,0,0.15),transparent_46%)]" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-4xl font-black text-primary-700 tracking-tight">
                  Blood Availability Board
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Live donor count by blood group.
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Critical: 0-2 | Low: 3-5 | Available: 6+
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {stats.map((row) => {
                const status = getAvailabilityStatus(row.availableDonors)
                const meterWidth = Math.min(row.availableDonors, 20) * 5
                return (
                  <div
                    key={row.bloodType}
                    className="rounded-2xl border border-primary-200 bg-white px-4 py-4 md:px-5 md:py-5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-3xl md:text-4xl font-black tracking-tight text-primary-600">
                        {row.bloodType}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] md:text-[11px] font-semibold ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className={`mt-3 text-3xl md:text-4xl font-extrabold ${status.accentClass}`}>
                      {row.availableDonors}
                    </p>
                    <p className="mt-1 text-xs md:text-sm text-slate-400">donors ready</p>
                    <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status.meterClass}`}
                        style={{ width: `${meterWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="donor-search"
          className="bg-cream-50 backdrop-blur rounded-3xl shadow-xl border border-primary-200 p-5 md:p-6 space-y-5 ring-1 ring-primary-100"
        >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-primary-700">Find a donor</h2>
            <p className="text-xs text-gray-600">
              Filter donors by blood group and district across Bangladesh.
            </p>
          </div>
          <form
            onSubmit={onSearch}
            className="flex flex-col sm:flex-row gap-2 text-xs items-stretch sm:items-center"
          >
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="rounded-full border-primary-200 text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Any blood group</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-full border-primary-200 text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Any district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-500"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto border border-primary-200 rounded-xl">
          <table className="min-w-full text-xs">
            <thead className="bg-cream-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Gender</th>
                <th className="px-3 py-2 text-left font-medium">Age</th>
                <th className="px-3 py-2 text-left font-medium">Blood Type</th>
                <th className="px-3 py-2 text-left font-medium">District</th>
                <th className="px-3 py-2 text-left font-medium">Availability</th>
                <th className="px-3 py-2 text-left font-medium">Rank</th>
                <th className="px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {donors.map((d) => (
                <tr key={d.id} className="hover:bg-cream-50">
                  <td className="px-3 py-2 text-gray-800">{d.name}</td>
                  <td className="px-3 py-2 text-gray-600">{d.gender}</td>
                  <td className="px-3 py-2 text-gray-600">{d.age}</td>
                  <td className="px-3 py-2 font-semibold text-primary-700">{d.bloodType}</td>
                  <td className="px-3 py-2 text-gray-600">{d.district}</td>
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
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
                      {d.rank}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/donors/${d.id}`)}
                      className="rounded-full border border-primary-200 px-3 py-1 text-[11px] font-medium text-gray-700 hover:border-primary-600 hover:text-primary-600"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {donors.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-xs text-gray-500">
                    No donors found for the selected filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage

