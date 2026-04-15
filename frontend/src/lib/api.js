import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  const isAdminRoute = window.location.pathname.startsWith('/admin')
  const userRole = localStorage.getItem('bloodlagbe_role')
  const userToken = userRole === 'ADMIN' ? null : localStorage.getItem('bloodlagbe_token')
  const adminToken = localStorage.getItem('bloodlagbe_admin_token')
  const token = isAdminRoute ? adminToken : userToken
  const isAuthEndpoint =
    config.url?.startsWith('/auth/login') || config.url?.startsWith('/auth/register')

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
