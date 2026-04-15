import { useEffect, useState } from 'react'
import api from '../lib/api'

function NotificationsPage() {
  const [items, setItems] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [expandedRequestId, setExpandedRequestId] = useState(null)
  const [incomingLoading, setIncomingLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actingRequestId, setActingRequestId] = useState(null)
  const [loading, setLoading] = useState(true)
  const role = localStorage.getItem('bloodlagbe_role')
  const isDonor = role === 'DONOR'

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadIncomingRequests = async () => {
    if (!isDonor) return
    setIncomingLoading(true)
    setActionError('')
    try {
      const res = await api.get('/requests/incoming')
      setIncomingRequests(res.data)
    } catch (e) {
      setIncomingRequests([])
      setActionError(e.response?.data?.message || 'Failed to load incoming blood requests.')
    } finally {
      setIncomingLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadIncomingRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)))
    } catch {
      // ignore
    }
  }

  const handleRequestAction = async (requestId, action) => {
    setActingRequestId(requestId)
    setActionError('')
    try {
      await api.post(`/request/${requestId}/${action}`)
      await loadIncomingRequests()
      await load()
    } catch (e) {
      const backendMessage =
        typeof e.response?.data === 'string' ? e.response.data : e.response?.data?.message
      setActionError(backendMessage || `Failed to ${action} request.`)
    } finally {
      setActingRequestId(null)
    }
  }

  const toggleDetails = (requestId) => {
    setExpandedRequestId((prev) => (prev === requestId ? null : requestId))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 text-xs bg-cream-100 min-h-screen">
      <h1 className="text-sm font-semibold text-primary-700">Notifications</h1>
      <p className="text-xs text-gray-600">
        You will receive alerts when a blood request is created, accepted, or rejected.
      </p>

      {isDonor && (
        <section className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-primary-700">Incoming Blood Requests</h2>
          {incomingLoading && <div className="text-gray-600">Loading incoming requests...</div>}
          {!incomingLoading && incomingRequests.length === 0 && (
            <div className="text-gray-600">No incoming requests yet.</div>
          )}
          {incomingRequests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-primary-200 px-3 py-3 space-y-3 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-gray-800">
                    <span className="font-medium">{r.requesterName}</span> requested blood.
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-600">
                    Status: {r.status} - {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDetails(r.id)}
                  className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-700 hover:border-primary-600 hover:text-primary-600"
                >
                  {expandedRequestId === r.id ? 'Hide details' : 'View details'}
                </button>
              </div>

              {expandedRequestId === r.id && (
                <div className="rounded-lg border border-primary-200 bg-cream-50 px-3 py-3 space-y-3">
                  <div className="grid gap-2 text-[11px] text-gray-700 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-gray-900">Requester:</span>{' '}
                      {r.requesterName}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Blood type:</span>{' '}
                      {r.requesterBloodType || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">District:</span>{' '}
                      {r.requesterDistrict || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Requester number:</span>{' '}
                      {r.requesterPhone || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Request for:</span>{' '}
                      {r.requestFor === 'MYSELF' ? 'Self' : 'Another person'}
                    </p>
                  </div>

                  {r.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actingRequestId === r.id}
                        onClick={() => handleRequestAction(r.id, 'accept')}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] text-emerald-700 hover:border-emerald-400 disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={actingRequestId === r.id}
                        onClick={() => handleRequestAction(r.id, 'reject')}
                        className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-700 hover:border-red-400 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-600">
                      {r.status}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          {actionError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-700">
              {actionError}
            </div>
          )}
        </section>
      )}

      <div className="bg-cream-50 rounded-2xl shadow-sm border border-primary-200 divide-y divide-primary-200">
        {loading && (
          <div className="px-4 py-4 text-gray-600">Loading notifications...</div>
        )}
        {!loading && items.length === 0 && (
          <div className="px-4 py-4 text-gray-600">No notifications yet.</div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-cream-100/80"
          >
            <div>
              <p className="text-xs text-gray-800">{n.message}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {n.status === 'UNREAD' && (
              <button
                type="button"
                onClick={() => markAsRead(n.id)}
                className="rounded-full border border-primary-200 px-3 py-1 text-[11px] text-gray-700 hover:border-primary-600 hover:text-primary-600"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationsPage
